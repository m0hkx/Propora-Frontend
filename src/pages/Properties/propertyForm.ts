import type { Property } from '../../data/mock';

/** Form shape shared by the add and edit property flows. */
export interface PropertyDraft {
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postal: string;
  units: string;
  baseRent: string;
  yearBuilt: string;
  floors: string;
  size: string;
  purchasePrice: string;
  revenue: string;
  expenses: string;
  status: Property['status'];
}

export const EMPTY_PROPERTY_DRAFT: PropertyDraft = {
  name: '', type: '', description: '', address: '', city: '', country: '', postal: '',
  units: '', baseRent: '', yearBuilt: '', floors: '', size: '', purchasePrice: '', revenue: '', expenses: '',
  status: 'Active',
};

/**
 * Map a saved property onto the form shape. The address is stored as
 * "street, city"; the country comes through verbatim. Fields the Property
 * model doesn't persist (postal, floors, finances detail, …) start blank.
 */
export function propertyToDraft(p: Property): PropertyDraft {
  const [street = '', ...rest] = p.address.split(',');
  return {
    name: p.name,
    type: p.type,
    description: '',
    address: street.trim(),
    city: rest.join(',').trim(),
    country: p.country ?? '',
    postal: '',
    units: String(p.units),
    baseRent: String(p.rent),
    yearBuilt: String(p.yearBuilt),
    floors: '',
    size: '',
    purchasePrice: '',
    revenue: String(p.rent * p.units),
    expenses: '',
    status: p.status,
  };
}
