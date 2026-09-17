import { useState } from 'react';
import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';
import SearchSelect from './SearchSelect';
import { CALLING_CODE_OPTIONS, DEFAULT_CALLING_COUNTRY } from '../data/phone';
import type { CountryCode } from '../data/phone';

/**
 * Two-part phone field: a searchable dial-code selector (reuses
 * `SearchSelect`) plus a national-number input that formats live via
 * libphonenumber-js's `AsYouType`. `onChange` always reports a single
 * composed string — international format once the number is complete
 * (e.g. "+1 619 555 0142"), otherwise whatever was typed — which is exactly
 * what `Tenant.phone` stores, so callers never need a separate country field.
 */
export default function PhoneInput({
  id,
  value,
  defaultCountry = DEFAULT_CALLING_COUNTRY,
  onChange,
  invalid = false,
}: {
  id: string;
  value: string;
  defaultCountry?: CountryCode;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const seeded = seed(value, defaultCountry);
  const [country, setCountry] = useState<CountryCode>(seeded.country);
  const [national, setNational] = useState(seeded.national);
  const [locked, setLocked] = useState(seeded.national.trim() !== '');
  const [prevDefaultCountry, setPrevDefaultCountry] = useState(defaultCountry);

  // Follow the property's country while the field is still untouched (empty,
  // never typed in, never manually picked), so the dial code is right before
  // the user types anything. Adjusted directly during render — React's
  // documented pattern for syncing state to a changing prop — rather than in
  // an effect, so it lands before paint instead of cascading a render.
  if (!locked && defaultCountry !== prevDefaultCountry) {
    setPrevDefaultCountry(defaultCountry);
    setCountry(defaultCountry);
  }

  const emit = (nextCountry: CountryCode, nextNational: string) => {
    if (nextNational.trim() === '') {
      onChange('');
      return;
    }
    const parsed = parsePhoneNumberFromString(nextNational, nextCountry);
    onChange(parsed ? parsed.formatInternational() : nextNational);
  };

  return (
    <div className="phone-field">
      <SearchSelect
        id={`${id}-country`}
        className="phone-country"
        value={country}
        onChange={(iso) => {
          const nextCountry = (iso === '' ? defaultCountry : iso) as CountryCode;
          const digits = national.replace(/\D/g, '');
          const reformatted = digits === '' ? '' : new AsYouType(nextCountry).input(digits);
          setLocked(true);
          setCountry(nextCountry);
          setNational(reformatted);
          emit(nextCountry, reformatted);
        }}
        options={CALLING_CODE_OPTIONS}
        placeholder="Code"
        searchPlaceholder="Search countries..."
        emptyLabel="No country matches that search"
        clearable={false}
      />
      <input
        id={id}
        className={`phone-number ${invalid ? 'invalid' : ''}`}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={national}
        onChange={(e) => {
          const formatted = new AsYouType(country).input(e.target.value);
          setLocked(formatted.trim() !== '');
          setNational(formatted);
          emit(country, formatted);
        }}
        placeholder="(555) 555-0100"
      />
    </div>
  );
}

function seed(value: string, fallback: CountryCode): { country: CountryCode; national: string } {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '—') return { country: fallback, national: '' };
  const parsed = parsePhoneNumberFromString(trimmed, fallback);
  if (parsed) return { country: (parsed.country ?? fallback) as CountryCode, national: parsed.formatNational() };
  return { country: fallback, national: trimmed };
}
