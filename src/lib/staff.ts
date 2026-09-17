import type { MaintenanceRequest, MaintenanceStaff } from '../data/mock';
import { isPhoneValid } from '../data/phone';
import type { CountryCode } from '../data/phone';

/** Maintenance staff domain helpers, mirroring `lib/units.ts`'s validate/blockers pair. */

export interface StaffInput {
  name: string;
  email: string;
  phone: string;
  specialty: MaintenanceRequest['category'];
  status: MaintenanceStaff['status'];
}

const EMAIL = /^\S+@\S+\.\S+$/;

/**
 * Service-level validation shared by the store actions (the form modal adds
 * per-field messages on top). Returns the first problem, or `null` when the
 * input is safe to persist.
 */
export function validateStaff(input: StaffInput, phoneCountry: CountryCode): string | null {
  if (input.name.trim() === '') return 'Name is required.';
  if (input.email.trim() === '') return 'Email is required.';
  if (!EMAIL.test(input.email.trim())) return 'Enter a valid email address.';
  if (input.phone.trim() !== '' && !isPhoneValid(input.phone, phoneCountry)) return 'Enter a valid phone number.';
  return null;
}

/** Reasons a staff member cannot be deleted: any open (non-Completed) request still assigned to them. */
export function getStaffBlockers(staffId: string, maintenance: MaintenanceRequest[]): string[] {
  const open = maintenance.filter((m) => m.assigneeId === staffId && m.status !== 'Completed');
  return open.map((m) => `Assigned to open request ${m.id} (${m.status})`);
}
