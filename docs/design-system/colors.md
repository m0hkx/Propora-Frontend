# Propora — Color & Visual Design System

> **Single source of truth** for Propora's color language.
> Extracted from the live codebase (`src/index.css` `:root` tokens + component usage in `src/components/*` and `src/pages/*`).
> Stack: React + Vite + Tailwind v4 (utilities + `@theme` tokens), **no dark theme** — entry `src/index.css`, composites in `src/styles/components.css`, globals in `src/styles/base.css`.
> Audience: developers and AI coding agents building landing pages, marketing pages, auth, settings, dashboards, or sibling projects in the Propora family.
> Rule: **document, don't redesign.** Every value below exists in the code today.
>
> **Tailwind migration note (2026-09-16):** the canonical token *values* now live in the `@theme` block in `src/index.css`
> (plus `--radius` / `--radius-sm` / `--shadow` as plain variables beside it); component styles live in
> `src/styles/components.css` and element-level globals in `src/styles/base.css`. This document remains the
> human-readable companion — the HEX/RGB/HSL values here are identical to `@theme`.

---

## 1. Core Brand Palette

### Primary — Trust Teal

```text
Name: Trust Teal (brand.primary)
HEX: #0F766E
RGB: rgb(15, 118, 110)
HSL: hsl(175, 77%, 26%)
Token: --color-primary (on: #FFFFFF)
```

Usage: primary buttons (`.btn-teal`), active/focus ring (`--color-ring`), progress fill, nav accent details, chart line/points, avatar palette, "on" switch state, timeline dots, unread dots, selected property outline.
Recommendation: **this is the primary brand color.** It should dominate interactive elements. Pair only with white or very light text.

### Secondary — Aqua Teal

```text
Name: Aqua Teal (brand.secondary)
HEX: #14B8A6
RGB: rgb(20, 184, 166)
HSL: hsl(173, 80%, 40%)
Token: --color-secondary (on: #0F172A)
```

Usage: gradient partner of primary (brand mark, progress fill, toast check), chart area-fill, secondary accents.
Recommendation: supporting color — use in gradients, fills, and highlights, never as body text on white.

### Accent — Professional Blue

```text
Name: Professional Blue (brand.accent)
HEX: #0369A1
RGB: rgb(3, 105, 161)
HSL: hsl(201, 96%, 32%)
Token: --color-accent (on: #FFFFFF). Also --color-info (same value).
```

Usage: text links (`.link-btn`), info badges, In-Progress status, hover color for sortable headers.
Recommendation: the "information/action link" color. The only blue in the semantic system — keep it that way.

---

## 2. Semantic Color System

| Role | Token | Value | Used for |
| ---- | ----- | ----- | -------- |
| Brand primary | `--color-primary` | `#0F766E` | Primary buttons, ring, progress, chart line |
| Brand secondary | `--color-secondary` | `#14B8A6` | Gradient partner, fills, toast check |
| Brand accent / info | `--color-accent` / `--color-info` | `#0369A1` | Links, info badges, In-Progress |
| Page background | `--color-background` | `#F0FDFA` | App background base (with body gradient) |
| Foreground / ink | `--color-foreground` | `#134E4A` | Body text, headings, primary buttons |
| Surface | `--color-card` | `#FFFFFF` | Cards, modals, tables, dropdowns |
| Surface text | `--color-card-foreground` | `#134E4A` | Text on cards (same ink) |
| Muted surface | `--color-muted` | `#E8F0F3` | Pills container, ghost hover, chat bubbles, tab idle |
| Muted text | `--color-muted-foreground` | `#475569` | Secondary labels, placeholders, table headers |
| Border | `--color-border` | `#99F6E4` | Inputs, cards, buttons, dividers (accent-tinted) |
| Hairline | *(literal)* | `#F1F5F9` | Table row dividers, dropdown section dividers |
| Focus ring | `--color-ring` | `#0F766E` | 3px `:focus-visible` outline + offset 2px |
| Success | `--color-success` / `-bg` | `#047857` / `#D1FAE5` | Paid, Active, Completed, collected stats |
| Warning | `--color-warn` / `-bg` | `#B45309` / `#FEF3C7` | Pending, Expiring, High priority, attention badges |
| Error | `--color-destructive` | `#DC2626` | Overdue, delete, validation errors, unread badge |
| Error (emphasis text) | *(badge.danger)* | `#B91C1C` on `#FEE2E2` | Strong danger badge only |
| Info bg | `--color-info-bg` | `#E0F2FE` | Info badge background |

Derived interactive states (from code, not separate tokens):

```text
Primary hover:  translateY(-1px) + 0 8px 20px rgba(15,118,110,.30)  (no color change)
Ghost hover:    background var(--color-muted) + lift + teal shadow
Link hover:     underline (color unchanged)
Nav pill hover: background #fff
Table row:      no row-hover rule today — rows rely on .clickable cursor
Disabled:       opacity .4 (pagination buttons only); no global disabled token exists
```

---

## 3. Neutral Palette

Propora neutrals are warm-gray with a teal tint, not pure gray. Only these shades exist — do not invent intermediate steps:

```text
#FFFFFF  surface        cards, modals, inputs, dropdowns
#F8FAFC  surface-sunken table headers, upload zone, chart grid area
#F1F5F9  hairline       table/section dividers, chart gridlines, card inner borders
#E8F0F3  muted surface  (--color-muted) pills, hovers, bubbles
#E2E8F0  control-off    switch track off-state
#475569  muted text     (--color-muted-foreground) secondary copy
#134E4A  ink            (--color-foreground) headings + body (deep teal, not black)
#0F172A  ink-deep       (--color-on-secondary) toast glyph, darkest accents
```

Notes:

* Body text is **never pure black** — ink is deep teal `#134E4A`.
* Borders are **mint-tinted** (`#99F6E4`), not gray — this is a signature trait; keep it.
* Page background is mint `#F0FDFA` with a vertical gradient to `#ECFEFF` → `#F8FAFC`.

---

## 4. Status Colors

| Status | Text / base | Background | Border | Use for |
| ------ | ----------- | ---------- | ------ | ------- |
| Success | `#047857` | `#D1FAE5` | — | Paid, Active, Completed, positive deltas, toasts |
| Warning | `#B45309` | `#FEF3C7` | — | Pending, Expiring Soon, High priority, "needs attention" |
| Error | `#DC2626` (badges/buttons) or `#B91C1C` on `#FEE2E2` (strong badge) | — / `#FEE2E2` | — | Overdue, Urgent, delete, validation, unread count |
| Info | `#0369A1` | `#E0F2FE` | — | In Progress, informational badges, record counts |
| Neutral | `#134E4A` | `#E8F0F3` | — | Types, counts, inactive states |

Rules:

* Status meaning is carried by **badge + text label together** (`.badge` always has text) — never color alone.
* Priority scale: Urgent → danger, High → warn, Medium → info, Low → neutral.
* Maintenance status scale: Completed → success, In Progress → info, Scheduled → neutral, Open → warn.
* `#DC2626` is also the destructive action color (delete buttons, error text, notification unread badge).

---

## 5. Component-Level Usage

**Buttons** (pill, `border-radius: 999px`, `font-weight: 700`):

* `.btn-primary`: ink `#134E4A` bg, white text. Hover: lift + `0 8px 20px rgba(19,78,74,.25)`.
* `.btn-teal`: primary `#0F766E` bg, white text. Hover: lift + teal shadow.
* `.btn-ghost`: white bg, mint border, ink text. Hover: muted bg + lift + soft teal shadow.
* Destructive: no dedicated class — ConfirmDialog reuses `.btn-primary` for confirm; delete row items are danger-colored text.
* Small variant `.btn-sm`: reduced padding, same colors.

**Inputs/selects/textarea**: white bg, `12px` radius, `1px` mint border; invalid → destructive border + destructive message text. Labels: 13px semibold muted.

**Cards**: white, `18px` radius (`--radius`), mint-tinted border (`rgba(153,246,228,.6)`), `--shadow`. Variants: `.tint` (white→mint→cream gradient for attention panels), `.dark` (ink→teal gradient, white text). KPI pattern: small muted label + large display number + trend badge.

**Topbar nav**: frosted white (`rgba(255,255,255,.82)` + blur 14px), pill container in muted `#E8F0F3`, active pill white with soft shadow.

**Tables**: white, header row `#F8FAFC` with muted 600-weight text, `#F1F5F9` row dividers, compact 10–12px padding. Sortable headers (`.th-sort`) are borderless buttons, hover turns primary.

**Modals**: overlay `rgba(19,78,74,.45)`; dialog white, `20px` radius, mint border, `0 24px 60px rgba(0,0,0,.22)`; section titles 12px uppercase muted; footer right-aligned actions. Escape + outside-click close everywhere.

**Dropdowns/menus**: white, `18px` radius, mint border, `0 20px 50px rgba(15,118,110,.18)`; row menus smaller (`12px`, teal-black shadow).

**Badges**: `999px` pill, 12px bold, tinted bg + saturated text per status table above.

**Toasts**: ink `#134E4A` panel, white text, teal check disc with deep-ink glyph, auto-dismiss 3.5s.

**Avatar**: gradient `#F59E0B → #0F766E`, white bold initials; tenant avatars use flat deterministic colors from `[#0F766E, #0369A1, #7C3AED, #B45309, #475569, #047857]` (initials only, no photos in-app).

**Charts**: teal line `#0F766E` 2.5px, area fill teal→amber fade, white points with teal stroke, tooltip ink panel with mint secondary text, donut teal track on `#F1F5F9`.

**Timeline**: mint left rail (`--color-border`), primary dots with white ring.

---

## 6. Gradients (approved list — do not extend)

```text
Page backdrop:      180deg  #F0FDFA 0%, #ECFEFF 40%, #F8FAFC 100%   (body only)
Brand mark/buttons: 135deg  var(--color-primary), var(--color-secondary)
Avatar:             135deg  #F59E0B, #0F766E
Progress fill:      90deg   #14B8A6 → #0F766E
Card tint:          135deg  #FFFFFF 0%, #ECFDF5 60%, #FEF9C3 100%   (attention panels only)
Card dark:          135deg  #134E4A, #0F766E                       (dark feature cards only)
Chart area:         vertical #14B8A6 @45% → #F59E0B @25%
Property image fallback art (decorative placeholders, NOT brand):
  teal/aqua, blue/sky, teal/gold, violet/cyan, ink/blue, slate/mint
```

Where gradients belong: brand mark, avatars, progress, chart fills, image fallbacks, the two card variants. Everywhere else: flat surfaces.

---

## 7. Opacity & Transparency

```text
rgba(255,255,255,.82)  frosted topbar (with blur)
rgba(153,246,228,.7/.6) card/nav mint borders
rgba(15,118,110,.08–.30) teal shadows (rest → hover → modal-adjacent)
rgba(19,78,74,.45)      modal overlay
rgba(0,0,0,.06–.25)     neutral shadows (pills → toasts)
#14B8A6 @45% → #F59E0B @25%  chart area fade
```

No glassmorphism beyond the topbar. No other transparency patterns exist.

---

## 8. Shadows

```text
--shadow (card):  0 10px 30px rgba(15,118,110,.08)
Pills/chips:      0 2px 10px rgba(0,0,0,.06)
Icon/avatar:      0 2px 8px rgba(0,0,0,.12)
Button hover:     0 8px 20px rgba(15–19,118,74,.25–.30)
Dropdown:         0 20px 50px rgba(15,118,110,.18)
Row menu:         0 14px 34px rgba(15,118,110,.16)
Modal:            0 24px 60px rgba(0,0,0,.22)
Toast/tooltip:    0 10–14px 24–34px rgba(0,0,0,.22–.25)
```

Signature: shadows are **teal-tinted**, never pure black except modal/toast/tooltip depth.

---

## 9. Typography Colors

* Font: Plus Jakarta Sans everywhere (`--font-display` = `--font-body`), weights 400–800; KPI/page titles 700–800.
* Headings/body: ink `#134E4A`. Secondary: muted `#475569`. Faint: muted at small sizes.
* Links: accent `#0369A1`, underline on hover only.
* Positive deltas: `#047857` bold; destructive text `#DC2626`.
* Inverse (on dark/teal): white; on dark card muted becomes `#CCFBF1`.
* Placeholder: inherits muted styling; no separate token.
* Disabled text: no token exists (only `opacity:.4` on disabled pagination).

---

## 10. Accessibility Notes (concerns, not redesigns)

```text
Potential concern: --color-border #99F6E4 on white ≈ 1.4:1 — fails WCAG 1.4.11
as a UI-identifier boundary. It is decorative (paired with shadows/shape),
but any future control that relies on the border alone should darken it.
Recommended consideration: add --color-control-border ≥ 3:1 for inputs.

Potential concern: muted #475569 on muted-bg #E8F0F3 ≈ 4.9:1 — passes AA
for normal text, but small 12px secondary copy is near the boundary.
Recommended consideration: keep secondary copy ≥ 12px and never lighter.

Potential concern: warn text #B45309 on #FEF3C7 and success #047857 on
#D1FAE5 pass AA; danger #B91C1C on #FEE2E2 passes. Status always pairs
badge + text label, so meaning never depends on color alone — preserve this.

Potential concern: amber #F59E0B used decoratively (avatar gradient, chart
fade) — never as text. Keep it that way (white on #F59E0B fails).
```

---

## 11. Design Tokens

```css
:root {
  /* Brand */
  --color-brand-primary: #0F766E;
  --color-brand-secondary: #14B8A6;
  --color-brand-accent: #0369A1;

  /* Background / surface */
  --color-background: #F0FDFA;
  --color-surface: #FFFFFF;
  --color-surface-sunken: #F8FAFC;
  --color-surface-muted: #E8F0F3;

  /* Text */
  --color-text-primary: #134E4A;
  --color-text-secondary: #475569;
  --color-text-inverse: #FFFFFF;
  --color-text-on-dark-muted: #CCFBF1;

  /* Border / focus */
  --color-border: #99F6E4;
  --color-hairline: #F1F5F9;
  --color-focus-ring: #0F766E;

  /* Status */
  --color-success: #047857;
  --color-success-bg: #D1FAE5;
  --color-warning: #B45309;
  --color-warning-bg: #FEF3C7;
  --color-error: #DC2626;
  --color-error-strong: #B91C1C;
  --color-error-bg: #FEE2E2;
  --color-info: #0369A1;
  --color-info-bg: #E0F2FE;

  /* Shape / depth (visual identity carriers) */
  --radius-card: 18px;
  --radius-control: 12px;
  --radius-pill: 999px;
  --shadow-card: 0 10px 30px rgba(15, 118, 110, 0.08);
}
```

Tailwind mapping (conceptual — project has no Tailwind; do not add it):

```js
// tailwind.config.js — conceptual mapping only
colors: {
  brand:   { primary: '#0F766E', secondary: '#14B8A6', accent: '#0369A1' },
  surface: { DEFAULT: '#FFFFFF', sunken: '#F8FAFC', muted: '#E8F0F3' },
  ink:     { DEFAULT: '#134E4A', muted: '#475569', deep: '#0F172A' },
  border:  { DEFAULT: '#99F6E4', hairline: '#F1F5F9' },
  success: { DEFAULT: '#047857', bg: '#D1FAE5' },
  warning: { DEFAULT: '#B45309', bg: '#FEF3C7' },
  error:   { DEFAULT: '#DC2626', strong: '#B91C1C', bg: '#FEE2E2' },
  info:    { DEFAULT: '#0369A1', bg: '#E0F2FE' },
}
```

---

## 12. Future Landing Page Translation

Same product, not a different website — reuse tokens, radius, pills, and teal-tinted shadows verbatim.

**Hero**: page-backdrop gradient bg; ink `#134E4A` headline (800 weight); muted `#475569` body; primary CTA = `.btn-teal` equivalent (teal pill, white text); secondary CTA = ghost equivalent (white, mint border); teal→aqua gradient reserved for logo mark and one accent flourish.

**Navigation**: frosted white bar like the app topbar; ink wordmark + teal gradient mark; muted links turning ink on hover; CTA = primary pill button.

**Features**: alternate white / `#F8FAFC` section backgrounds; white 18px cards with mint borders; icon chips in muted `#E8F0F3` with primary glyphs; status colors only for real statuses.

**Pricing**: white cards; recommended plan = `.tint` gradient card or teal border + "Most popular" success badge; CTA teal; muted feature list with teal checks.

**Testimonials**: `#F8FAFC` or tint band; ink quotes; gradient-initial avatars (same avatar system); muted names.

**Footer**: ink `#134E4A` background, white links, `#CCFBF1` secondary text, hairline dividers in `rgba(153,246,228,.25)`.

**Auth/settings/product pages**: white 20px cards on the page gradient, 12px mint inputs, teal submit, destructive only for delete — identical to app modals/forms.

---

## 13. Color Usage Rules

1. Teal `#0F766E` dominates interactive elements; mint background `#F0FDFA` dominates canvas; white dominates surfaces.
2. Blue `#0369A1` is for links/info only — never decorative backgrounds.
3. Amber `#F59E0B`, violet `#7C3AED`, sky `#0EA5E9` exist **only** inside gradients/image fallbacks — never flat UI.
4. `#DC2626` is reserved for destructive/error. `#B91C1C` only inside the strong danger badge.
5. Status colors appear only as badges with text labels.
6. Neutrals first: reach for white/muted/hairline before any new gray.
7. One gradient per viewport focus; flat surfaces everywhere else.
8. Primary actions get full emphasis (solid fill + hover lift); secondary actions stay ghost.

## 14. Do / Don't

Do: use Trust Teal consistently · preserve the mint→white→hairline hierarchy · reuse semantic badges · keep badge+label pairing · use teal-tinted shadows · keep Plus Jakarta Sans.
Don't: introduce random colors · use success decoratively · use destructive as accent · build the landing page in a different palette · add glass beyond the topbar · add a dark theme without a full token pass.

---

## 15. Color Reference Table

| Token | Name | HEX | RGB | HSL | Usage |
| ----- | ---- | --- | --- | --- | ----- |
| `brand.primary` | Trust Teal | `#0F766E` | 15, 118, 110 | 175, 77%, 26% | Buttons, ring, charts |
| `brand.secondary` | Aqua Teal | `#14B8A6` | 20, 184, 166 | 173, 80%, 40% | Gradients, fills |
| `brand.accent` | Professional Blue | `#0369A1` | 3, 105, 161 | 201, 96%, 32% | Links, info |
| `background.default` | Mint Wash | `#F0FDFA` | 240, 253, 250 | 166, 76%, 97% | Page base |
| `surface.default` | White | `#FFFFFF` | 255, 255, 255 | 0, 0%, 100% | Cards, modals |
| `surface.sunken` | Frost | `#F8FAFC` | 248, 250, 252 | 210, 40%, 98% | Table headers, zones |
| `surface.muted` | Mist | `#E8F0F3` | 232, 240, 243 | 196, 31%, 93% | Pills, hovers |
| `text.primary` | Deep Teal Ink | `#134E4A` | 19, 78, 74 | 176, 61%, 19% | Headings, body |
| `text.secondary` | Slate Muted | `#475569` | 71, 85, 105 | 215, 19%, 35% | Secondary copy |
| `text.deep` | Abyss | `#0F172A` | 15, 23, 42 | 222, 47%, 11% | Darkest accents |
| `border.default` | Mint Border | `#99F6E4` | 153, 246, 228 | 168, 84%, 78% | Inputs, cards |
| `border.hairline` | Hairline | `#F1F5F9` | 241, 245, 249 | 210, 40%, 96% | Dividers |
| `status.success` | Emerald | `#047857` | 4, 120, 87 | 163, 94%, 24% | Paid/Active/Done |
| `status.success-bg` | Mint Tint | `#D1FAE5` | 209, 250, 229 | 149, 80%, 90% | Success badge bg |
| `status.warning` | Amber Brown | `#B45309` | 180, 83, 9 | 26, 90%, 37% | Pending/Expiring |
| `status.warning-bg` | Cream | `#FEF3C7` | 254, 243, 199 | 48, 96%, 89% | Warning badge bg |
| `status.error` | Signal Red | `#DC2626` | 220, 38, 38 | 0, 72%, 51% | Overdue/Delete |
| `status.error-strong` | Deep Red | `#B91C1C` | 185, 28, 28 | 0, 74%, 42% | Strong badge text |
| `status.error-bg` | Blush | `#FEE2E2` | 254, 226, 226 | 0, 93%, 94% | Strong badge bg |
| `status.info-bg` | Sky Tint | `#E0F2FE` | 224, 242, 254 | 204, 94%, 94% | Info badge bg |
| `accent.amber` | Marigold | `#F59E0B` | 245, 158, 11 | 38, 92%, 50% | Gradients only |
| `accent.orange-dot` | Ember | `#EA580C` | 234, 88, 12 | 21, 90%, 48% | Attention dot |
| `accent.olive-dot` | Harvest | `#CA8A04` | 202, 138, 4 | 41, 96%, 40% | Attention dot |

---

## 16. Code Examples

### CSS variables (drop-in for a new page in the family)

```css
:root {
  /* Brand */
  --color-brand-primary: #0F766E;
  --color-brand-secondary: #14B8A6;
  --color-brand-accent: #0369A1;

  /* Background / surface */
  --color-background: #F0FDFA;
  --color-surface: #FFFFFF;
  --color-surface-sunken: #F8FAFC;
  --color-surface-muted: #E8F0F3;

  /* Text */
  --color-text-primary: #134E4A;
  --color-text-secondary: #475569;
  --color-text-inverse: #FFFFFF;

  /* Borders / focus */
  --color-border: #99F6E4;
  --color-hairline: #F1F5F9;
  --color-focus-ring: #0F766E;

  /* Status */
  --color-success: #047857;
  --color-success-bg: #D1FAE5;
  --color-warning: #B45309;
  --color-warning-bg: #FEF3C7;
  --color-error: #DC2626;
  --color-error-bg: #FEE2E2;
  --color-info: #0369A1;
  --color-info-bg: #E0F2FE;

  /* Shape */
  --radius-card: 18px;
  --radius-control: 12px;
  --radius-pill: 999px;
}

body {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  background: linear-gradient(180deg, #F0FDFA 0%, #ECFEFF 40%, #F8FAFC 100%);
  color: var(--color-text-primary);
}
```

### Component snippets (same language as the app)

```css
/* Primary button */
.btn-landing-primary {
  background: #0F766E; color: #fff; border-radius: 999px;
  padding: 12px 24px; font-weight: 700;
}
.btn-landing-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.30);
}

/* Feature card */
.feature-card {
  background: #fff; border: 1px solid rgba(153, 246, 228, 0.6);
  border-radius: 18px; box-shadow: 0 10px 30px rgba(15, 118, 110, 0.08);
}

/* Status badge */
.badge-success { background: #D1FAE5; color: #047857; border-radius: 999px; }
```

---

## 17. Verification Notes

1. Inspected: `src/index.css` (full token list + all component rules), `src/components/*` (ui, charts, Modal, Toasts, panels), `src/pages/*` incl. inline styles, `src/data/mock.ts` (avatar palette), `package.json` (no Tailwind).
2. Every HEX above was found verbatim in the codebase (grep `#xxxxxx`, `rgba()`, `linear-gradient`, avatar/notification palettes).
3. Duplicates flagged: `--color-accent` = `--color-info` (`#0369A1`) — intentional single blue, keep merged. `#DC2626` vs `#B91C1C` — distinct roles (action vs badge text), keep both. `#0F766E` = `--color-ring` — same token value reused, fine.
4. Similar-but-distinct: `#E8F0F3` (muted surface) vs `#F1F5F9` (hairline) vs `#F8FAFC` (sunken) — three close light grays with different jobs; preserved as-is.
5. Hover/active/focus documented in §2/§5 (note: tables have no row-hover rule; disabled has no token — recorded as gaps, not filled).
6. Status/background/surface/text/border all documented.
7. Landing guidance in §12. No application code modified (only new `docs/` file).
