/**
 * Shared document-upload validation.
 *
 * Two gates share this module so they can never drift apart:
 * - Frontend (`UploadDocumentModal`): `validateDocRecord` on the live File,
 *   then `verifyDocFileContent` which sniffs actual bytes.
 * - Storage (`useStore.addDocument`, the ingestion point — this app has no
 *   backend): `validateDocRecord` on the record metadata.
 *
 * Extension/MIME alone never pass a file: OOXML containers (docx/xlsx) are
 * verified against the zip central directory, PDFs and legacy Office files
 * against magic bytes, and plain text against NUL-byte sampling — so a
 * renamed PNG, ZIP or executable cannot slip through.
 */

export interface DocFormat {
  ext: string;
  label: string;
  mimes: string[];
}

export const SUPPORTED_DOC_FORMATS: DocFormat[] = [
  { ext: 'pdf', label: 'PDF', mimes: ['application/pdf'] },
  { ext: 'doc', label: 'DOC', mimes: ['application/msword'] },
  {
    ext: 'docx',
    label: 'DOCX',
    // Safari reports OOXML as application/zip; the central-directory sniff below
    // tells a real document apart from a plain archive.
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
  },
  { ext: 'xls', label: 'XLS', mimes: ['application/vnd.ms-excel'] },
  {
    ext: 'xlsx',
    label: 'XLSX',
    mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
  },
  { ext: 'txt', label: 'TXT', mimes: ['text/plain'] },
];

const formatByExt = new Map(SUPPORTED_DOC_FORMATS.map((f) => [f.ext, f]));

/** 10 MB — no previous limit existed; seeds top out at 12 MB for a legacy archive. */
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
export const MAX_DOC_LABEL = '10 MB';

/** File-picker filter: extensions (what pickers respect) plus MIME equivalents. */
export const DOC_ACCEPT = [
  ...SUPPORTED_DOC_FORMATS.map((f) => `.${f.ext}`),
  ...SUPPORTED_DOC_FORMATS.flatMap((f) => f.mimes),
].join(',');

/** "PDF, DOC, DOCX, XLS, XLSX, TXT" — for hints and error messages. */
export function docFormatList(): string {
  return SUPPORTED_DOC_FORMATS.map((f) => f.label).join(', ');
}

/** Lower-cased extension without the dot; '' when there is none. Never trusts directories. */
export function extOf(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

/**
 * Defense-in-depth for the display name: drop any directory components
 * (path traversal), strip control characters, collapse whitespace, cap length.
 * The store persists the sanitized result — a user filename never decides
 * where anything is kept.
 */
export function sanitizeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? '';
  let clean = '';
  for (const ch of base) {
    const code = ch.codePointAt(0) ?? 32;
    if (code < 32 || code === 127) continue;
    clean += ch;
  }
  return clean.replace(/\s+/g, ' ').trim().slice(0, 180);
}

/** "2.4 MB" / "880 KB" / "512 B" — matches the seed data style. */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${Math.round(n)} B`;
}

/**
 * Metadata gate shared by the picker and the storage layer. `sizeBytes` and
 * `mime` are optional so legacy records (name only) still validate by
 * extension; anything carrying real metadata is held to the full policy.
 * Returns the user-facing reason, or `null` when the record may proceed to
 * content verification / storage.
 */
export function validateDocRecord(
  name: string,
  sizeBytes?: number,
  mime?: string
): string | null {
  const ext = extOf(name);
  const format = formatByExt.get(ext);
  if (!format) {
    return `Unsupported file type. Please upload a ${docFormatList()} document.`;
  }
  if (sizeBytes !== undefined) {
    if (!(sizeBytes > 0)) return 'That file is empty. Please choose a non-empty document.';
    if (sizeBytes > MAX_DOC_BYTES) {
      return `File is too large (${formatBytes(sizeBytes)}). Maximum size is ${MAX_DOC_LABEL}.`;
    }
  }
  // Browser MIME is advisory, never trusted for acceptance: an explicit
  // mismatch fails closed, an empty value defers to content sniffing.
  if (mime !== undefined && mime !== '' && !format.mimes.includes(mime.toLowerCase())) {
    return `That file does not look like a ${format.label} document (reported as ${mime}).`;
  }
  return null;
}

function hasPrefix(b: Uint8Array, sig: readonly number[]): boolean {
  return sig.every((v, i) => b[i] === v);
}

/**
 * Magic-byte check on the file head (`txt` takes a ~4 KB sample instead).
 * Pure over bytes so it runs in Node tests as well as the browser.
 */
export function sniffDocHead(head: Uint8Array, ext: string): string | null {
  switch (ext) {
    case 'pdf':
      return hasPrefix(head, [0x25, 0x50, 0x44, 0x46]) ? null : 'is not a PDF document';
    case 'doc':
    case 'xls':
      return hasPrefix(head, [0xd0, 0xcf, 0x11, 0xe0]) ? null : 'is not a legacy Word/Excel document';
    case 'docx':
    case 'xlsx':
      return head.length >= 2 && head[0] === 0x50 && head[1] === 0x4b
        ? null
        : 'is not a Word/Excel (OOXML) document';
    case 'txt':
      return head.includes(0) ? 'is not a plain-text document' : null;
    default:
      return 'has an unsupported format';
  }
}

function u16le(b: Uint8Array, o: number): number {
  return b[o] | (b[o + 1] << 8);
}

function u32le(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

/**
 * Verify a PK container really is docx/xlsx by walking the zip central
 * directory in `tail` (`tailStart` = file offset of `tail[0]`). Requires an
 * entry under `word/` (docx) or `xl/` (xlsx) — a renamed .zip fails here.
 * Fails closed on anything unparsable.
 */
export function sniffOoxmlTail(tail: Uint8Array, tailStart: number, ext: string): string | null {
  const corrupt = 'could not be read as a Word/Excel document';
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 0x05 && tail[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0 || eocd + 22 > tail.length) return corrupt;
  const count = u16le(tail, eocd + 10);
  const cdSize = u32le(tail, eocd + 12);
  const cdStart = u32le(tail, eocd + 16) - tailStart;
  if (count === 0 || count > 60000 || cdSize === 0 || cdStart < 0 || cdStart + cdSize > tail.length) {
    return corrupt;
  }
  const want = ext === 'docx' ? 'word/' : 'xl/';
  let p = cdStart;
  const end = cdStart + cdSize;
  let found = false;
  for (let n = 0; n < count && p + 46 <= end; n++) {
    if (tail[p] !== 0x50 || tail[p + 1] !== 0x4b || tail[p + 2] !== 0x01 || tail[p + 3] !== 0x02) {
      return corrupt;
    }
    const nameLen = u16le(tail, p + 28);
    const extraLen = u16le(tail, p + 30);
    const commentLen = u16le(tail, p + 32);
    if (p + 46 + nameLen > end) return corrupt;
    if (new TextDecoder().decode(tail.slice(p + 46, p + 46 + nameLen)).startsWith(want)) found = true;
    p += 46 + nameLen + extraLen + commentLen;
  }
  return found ? null : 'is a ZIP archive, not a Word/Excel document';
}

const TAIL_BYTES = 70000;

/**
 * Full content verification for a live File: magic bytes for every family
 * plus central-directory proof for OOXML. Returns the user-facing reason or
 * `null` when the bytes match the claimed extension.
 */
export async function verifyDocFileContent(file: File): Promise<string | null> {
  const clean = sanitizeFileName(file.name);
  const label = clean === '' ? 'That file' : `\u201C${clean}\u201D`;
  const ext = extOf(file.name);
  if (ext === 'txt') {
    const sample = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    return sample.includes(0) ? `${label} is not a plain-text document.` : null;
  }
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const headErr = sniffDocHead(head, ext);
  if (headErr) return `${label} ${headErr}. Please upload a genuine ${docFormatList()} file.`;
  if (ext === 'docx' || ext === 'xlsx') {
    const tailLen = Math.min(file.size, TAIL_BYTES);
    const tail = new Uint8Array(await file.slice(Math.max(0, file.size - tailLen)).arrayBuffer());
    const tailErr = sniffOoxmlTail(tail, file.size - tail.length, ext);
    if (tailErr) return `${label} ${tailErr}.`;
  }
  return null;
}
