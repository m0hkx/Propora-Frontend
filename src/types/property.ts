export type PropertyStatus = 'Active' | 'Vacant' | 'Under Maintenance';

export interface Property {
  id: string;
  name: string;
  address: string;
  /** ISO 3166-1 country name, as picked in the property form. Optional: older properties predate the field. */
  country?: string;
  type: string;
  units: number;
  occupied: number;
  rent: number;
  status: PropertyStatus;
  image: string;
  imageUrl: string;
  yearBuilt: number;
}

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
