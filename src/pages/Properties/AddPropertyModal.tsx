import { useState } from 'react';
import type { Property } from '../../data/mock';
import Modal from '../../components/Modal';

const TYPES = ['Apartment Building', 'Villa', 'Office', 'Commercial', 'Mixed Use', 'Other'];

interface Draft {
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postal: string;
  units: string;
  yearBuilt: string;
  floors: string;
  size: string;
  purchasePrice: string;
  revenue: string;
  expenses: string;
}

const EMPTY: Draft = {
  name: '', type: '', description: '', address: '', city: '', country: '', postal: '',
  units: '', yearBuilt: '', floors: '', size: '', purchasePrice: '', revenue: '', expenses: '',
};

export default function AddPropertyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: Property) => void;
}) {
  const [form, setForm] = useState<Draft>(EMPTY);
  const [imageUrl, setImageUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const set = (patch: Partial<Draft>) => setForm({ ...form, ...patch });

  const errors = {
    name: form.name.trim() === '' ? 'Property name is required.' : '',
    type: form.type === '' ? 'Property type is required.' : '',
    address: form.address.trim() === '' ? 'Address is required.' : '',
    city: form.city.trim() === '' ? 'City is required.' : '',
    units: form.units.trim() === '' ? 'Number of units is required.' : !/^\d+$/.test(form.units.trim()) || Number(form.units) <= 0 ? 'Enter a valid number of units.' : '',
  };
  
  const invalid = Object.values(errors).some((e) => e !== '');

  const readFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(f);
  };

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    const units = Number(form.units);
    const seed = `custom-${Date.now()}`;
    onCreate({
      id: `p-${Date.now()}`,
      name: form.name.trim(),
      address: `${form.address.trim()}, ${form.city.trim()}`,
      type: form.type,
      units,
      occupied: 0,
      rent: form.revenue.trim() !== '' && units > 0 ? Math.round(Number(form.revenue) / units) : 0,
      status: 'Active',
      image: form.name.trim().split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase(),
      imageUrl: imageUrl === '' ? `https://picsum.photos/seed/${seed}/600/400` : imageUrl,
      yearBuilt: form.yearBuilt.trim() !== '' ? Number(form.yearBuilt) : new Date().getFullYear(),
    });
  };

  const field = (key: 'name' | 'address' | 'city' | 'units', label: string, placeholder?: string) => (
    <div className="field">
      <label htmlFor={`ap-${key}`}>{label} *</label>
      <input
        id={`ap-${key}`}
        value={form[key]}
        onChange={(e) => set({ [key]: e.target.value })}
        className={submitted && errors[key] !== '' ? 'invalid' : ''}
        placeholder={placeholder}
      />
      {submitted && errors[key] !== '' ? <span className="field-error">{errors[key]}</span> : null}
    </div>
  );

  return (
    <Modal title="Add Property" onClose={onClose} wide>
      <div className="modal-section">
        <h4>Basic Information</h4>
        <div className="form-grid">
          {field('name', 'Property Name', 'Sunset Apartments')}
          <div className="field">
            <label htmlFor="ap-type">Property Type *</label>
            <select id="ap-type" value={form.type} onChange={(e) => set({ type: e.target.value })} className={submitted && errors.type !== '' ? 'invalid' : ''}>
              <option value="">Select type</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
        <div className="form-grid">
          {field('address', 'Address', '123 Main St')}
          {field('city', 'City', 'Amman')}
          <div className="field">
            <label htmlFor="ap-country">Country</label>
            <input id="ap-country" value={form.country} onChange={(e) => set({ country: e.target.value })} placeholder="Jordan" />
          </div>
          <div className="field">
            <label htmlFor="ap-postal">Postal Code</label>
            <input id="ap-postal" value={form.postal} onChange={(e) => set({ postal: e.target.value })} placeholder="11118" />
          </div>
        </div>
      </div>

      <div className="modal-section">
        <h4>Property Details</h4>
        <div className="form-grid">
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
        <div className="form-grid">
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
            <button className="btn btn-ghost btn-sm" type="button" style={{ marginTop: 8 }} onClick={() => setImageUrl('')}>Remove image</button>
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
        <button className="btn btn-teal" type="button" onClick={submit}>Create Property</button>
      </div>
    </Modal>
  );
}
