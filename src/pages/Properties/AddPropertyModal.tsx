import { useState } from 'react';
import type { PropertyDraft } from './propertyForm';
import Modal from '../../components/Modal';
import SearchSelect from '../../components/SearchSelect';
import { COUNTRY_OPTIONS, isValidCountryName } from '../../data/countries';

const TYPES = ['Apartment Building', 'Villa', 'Office', 'Commercial', 'Mixed Use', 'Other'];

/** Accepts `1200` or `1200.50`; rejects blanks, text and zero. */
const MONEY = /^\d+(\.\d{1,2})?$/;

export default function AddPropertyModal({
  mode,
  title,
  initial,
  initialImageUrl,
  onClose,
  onSubmit,
}: {
  mode: 'add' | 'edit';
  title: string;
  initial: PropertyDraft;
  initialImageUrl: string;
  onClose: () => void;
  onSubmit: (d: PropertyDraft, imageUrl: string) => void;
}) {
  const [form, setForm] = useState<PropertyDraft>(initial);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [submitted, setSubmitted] = useState(false);

  const set = (patch: Partial<PropertyDraft>) => setForm({ ...form, ...patch });

  const errors = {
    name: form.name.trim() === '' ? 'Property name is required.' : '',
    type: form.type === '' ? 'Property type is required.' : '',
    address: form.address.trim() === '' ? 'Address is required.' : '',
    city: form.city.trim() === '' ? 'City is required.' : '',
    units: form.units.trim() === '' ? 'Number of units is required.' : !/^\d+$/.test(form.units.trim()) || Number(form.units) <= 0 ? 'Enter a valid number of units.' : '',
    // The picker can only ever hand back a listed country; this is the guard
    // that keeps a stray value out if it ever gets set another way.
    country: form.country !== '' && !isValidCountryName(form.country) ? 'Select a country from the list.' : '',
    baseRent: form.baseRent.trim() === '' ? 'Base rent is required.' : !MONEY.test(form.baseRent.trim()) || Number(form.baseRent) <= 0 ? 'Enter a base rent greater than 0.' : '',
  };

  const invalid = Object.values(errors).some((e) => e !== '');

  // Seeded properties predate the closed type vocabulary — keep a stored
  // type selectable instead of stranding the field on a blank option.
  const typeOptions = form.type !== '' && !TYPES.includes(form.type) ? [form.type, ...TYPES] : TYPES;

  const readFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(f);
  };

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    onSubmit({ ...form, name: form.name.trim(), address: form.address.trim(), city: form.city.trim() }, imageUrl);
  };

  const field = (
    key: 'name' | 'address' | 'city' | 'units' | 'baseRent',
    label: string,
    placeholder?: string,
    inputMode?: 'numeric' | 'decimal'
  ) => (
    <div className="field">
      <label htmlFor={`ap-${key}`}>{label} *</label>
      <input
        id={`ap-${key}`}
        value={form[key]}
        inputMode={inputMode}
        onChange={(e) => set({ [key]: e.target.value })}
        className={submitted && errors[key] !== '' ? 'invalid' : ''}
        placeholder={placeholder}
      />
      {submitted && errors[key] !== '' ? <span className="field-error">{errors[key]}</span> : null}
    </div>
  );

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="modal-section">
        <h4>Basic Information</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {field('name', 'Property Name', 'Sunset Apartments')}
          <div className="field">
            <label htmlFor="ap-type">Property Type *</label>
            <select id="ap-type" value={form.type} onChange={(e) => set({ type: e.target.value })} className={submitted && errors.type !== '' ? 'invalid' : ''}>
              <option value="">Select type</option>
              {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {submitted && errors.type !== '' ? <span className="field-error">{errors.type}</span> : null}
          </div>
        </div>
        <div className="field">
          <label htmlFor="ap-desc">Description</label>
          <textarea id="ap-desc" value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Brief description of the property..." />
        </div>
      </div>

      <div className="modal-section">
        <h4>Location</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {field('address', 'Address', '123 Main St')}
          {field('city', 'City', 'Amman')}
          <div className="field">
            <label htmlFor="ap-country">Country</label>
            <SearchSelect
              id="ap-country"
              value={form.country}
              onChange={(country) => set({ country })}
              options={COUNTRY_OPTIONS}
              placeholder="Select country"
              searchPlaceholder="Search countries..."
              emptyLabel="No country matches that search"
              invalid={submitted && errors.country !== ''}
            />
            {submitted && errors.country !== '' ? <span className="field-error">{errors.country}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="ap-postal">Postal Code</label>
            <input id="ap-postal" value={form.postal} onChange={(e) => set({ postal: e.target.value })} placeholder="11118" />
          </div>
        </div>
      </div>

      <div className="modal-section">
        <h4>Property Details</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {field('units', 'Total Units', '24')}
          <div className="field">
            <label htmlFor="ap-year">Year Built</label>
            <input id="ap-year" inputMode="numeric" value={form.yearBuilt} onChange={(e) => set({ yearBuilt: e.target.value })} placeholder="2018" />
          </div>
          <div className="field">
            <label htmlFor="ap-floors">Number of Floors</label>
            <input id="ap-floors" inputMode="numeric" value={form.floors} onChange={(e) => set({ floors: e.target.value })} placeholder="4" />
          </div>
          <div className="field">
            <label htmlFor="ap-size">Property Size (sqm)</label>
            <input id="ap-size" inputMode="numeric" value={form.size} onChange={(e) => set({ size: e.target.value })} placeholder="3200" />
          </div>
        </div>
      </div>

      <div className="modal-section">
        <h4>Financial Information</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {field('baseRent', 'Base Rent (per unit / month)', '2850', 'decimal')}
          <div className="field">
            <label htmlFor="ap-price">Purchase Price</label>
            <input id="ap-price" inputMode="decimal" value={form.purchasePrice} onChange={(e) => set({ purchasePrice: e.target.value })} placeholder="850000" />
          </div>
          <div className="field">
            <label htmlFor="ap-rev">Monthly Expected Revenue</label>
            <input id="ap-rev" inputMode="decimal" value={form.revenue} onChange={(e) => set({ revenue: e.target.value })} placeholder="24800" />
          </div>
          <div className="field">
            <label htmlFor="ap-exp">Monthly Expenses</label>
            <input id="ap-exp" inputMode="decimal" value={form.expenses} onChange={(e) => set({ expenses: e.target.value })} placeholder="5200" />
          </div>
        </div>
      </div>

      <div className="modal-section">
        <h4>Property Image</h4>
        {imageUrl !== '' ? (
          <div>
            <img src={imageUrl} alt="Property preview" className="upload-preview" />
            <button className="btn btn-ghost btn-sm mt-2" type="button" onClick={() => setImageUrl('')}>Remove image</button>
          </div>
        ) : (
          <label
            className="upload-zone"
            htmlFor="ap-image"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              readFile(e.dataTransfer.files?.[0]);
            }}
          >
            <strong>Upload Property Image</strong>
            <span className="small muted">Drag &amp; drop or browse files</span>
            <input id="ap-image" type="file" accept="image/*" hidden onChange={(e) => readFile(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>
          {mode === 'add' ? 'Create Property' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}
