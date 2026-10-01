import { create } from 'zustand';

import { createPropertySlice, type PropertySlice } from './slices/propertySlice';
import { createTenantSlice, type TenantSlice } from './slices/tenantSlice';
import { createPaymentSlice, type PaymentSlice } from './slices/paymentSlice';
import { createMaintenanceSlice, type MaintenanceSlice } from './slices/maintenanceSlice';
import { createDocumentSlice, type DocumentSlice } from './slices/documentSlice';
import { createInboxSlice, type InboxSlice } from './slices/inboxSlice';
import { createUiSlice, type UiSlice } from './slices/uiSlice';

export type { Toast } from './slices/uiSlice';

export type StoreState = PropertySlice &
  TenantSlice &
  PaymentSlice &
  MaintenanceSlice &
  DocumentSlice &
  InboxSlice &
  UiSlice & {
    /**
     * Fetches every server-backed resource. AppShell calls it on mount, i.e. after
     * every login (and twice in dev under StrictMode). Rejects if any fetch fails.
     */
    loadAll: () => Promise<void>;
  };

export const useStore = create<StoreState>()((set, get, api) => ({
  ...createPropertySlice(set, get, api),
  ...createTenantSlice(set, get, api),
  ...createPaymentSlice(set, get, api),
  ...createMaintenanceSlice(set, get, api),
  ...createDocumentSlice(set, get, api),
  ...createInboxSlice(set, get, api),
  ...createUiSlice(set, get, api),

  loadAll: async () => {
    await get().fetchProperties();
    await Promise.all([
      get().fetchUnits(),
      get().fetchTenants(),
      get().fetchLeases(),
      get().fetchPayments(),
      get().fetchMaintenance(),
      get().fetchStaff(),
      get().fetchDocuments(),
      get().fetchNotifications(),
    ]);
  },
}));

const initialState = useStore.getState();

/**
 * Puts every slice back to its starting state (empty resources, seed conversations,
 * no toasts). Called on logout so the next account never sees the previous one's data.
 */
export function resetStore() {
  useStore.setState(initialState, true);
}
