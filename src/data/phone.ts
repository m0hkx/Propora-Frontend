/**
 * Phone number helpers backing `PhoneInput`. Formatting and validation are
 * delegated entirely to libphonenumber-js — this module only adapts its data
 * (dial codes, per-country validity) to the app's own conventions: country
 * names come from `data/countries.ts` so labels match the property Country
 * picker, and dial-code options are shaped for `SearchSelect`.
 */
import { getCountries, getCountryCallingCode, isValidPhoneNumber } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { COUNTRIES } from './countries';
import type { SearchSelectOption } from '../components/searchSelectUtils';

export type { CountryCode };

/** Fallback dial-code country when nothing else narrows it down. */
export const DEFAULT_CALLING_COUNTRY: CountryCode = 'US';

const NAME_BY_ISO = new Map(COUNTRIES.map((c) => [c.code, c.name]));
const CALLING_COUNTRIES = new Set(getCountries());

const flag = (iso: string) =>
  iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

/**
 * Dial-code options for the phone field's country selector. `label` is just
 * the flag + calling code — that's all the closed trigger and the option
 * row's main line show — while the country name rides along as `detail`
 * (muted sub-line, row-only) and inside `keywords` so search-by-name still
 * works.
 */
export const CALLING_CODE_OPTIONS: SearchSelectOption[] = getCountries()
  .filter((iso) => NAME_BY_ISO.has(iso))
  .map((iso) => {
    const name = NAME_BY_ISO.get(iso) as string;
    const code = `+${getCountryCallingCode(iso)}`;
    return { value: iso, label: `${flag(iso)} ${code}`, detail: name, keywords: `${name} ${iso} ${code}` };
  })
  .sort((a, b) => a.detail!.localeCompare(b.detail!));

/**
 * Maps a property's stored country name (as picked in the property form) to
 * a libphonenumber calling-code country, so the tenant phone field can
 * default its dial code to match the tenant's selected property.
 */
export function callingCountryForName(name: string | undefined): CountryCode | undefined {
  if (name === undefined) return undefined;
  const entry = COUNTRIES.find((c) => c.name === name);
  if (entry === undefined || !CALLING_COUNTRIES.has(entry.code as CountryCode)) return undefined;
  return entry.code as CountryCode;
}

/**
 * Submit-time guard. Empty is allowed (phone is optional). `country` is only
 * used when `value` has no explicit "+" country prefix — an already
 * internationally-formatted number validates against the country encoded in
 * it, so this stays correct even if `country` no longer matches (e.g. the
 * tenant's property changed after the number was saved).
 */
export function isPhoneValid(value: string, country: CountryCode): boolean {
  return isValidPhoneNumber(value.trim(), country);
}
