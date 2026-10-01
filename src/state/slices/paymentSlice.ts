import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { Payment, PaymentDraft } from '../../types';
import * as paymentsApi from '../../api/payments';

export interface PaymentSlice {
  payments: Payment[];
  fetchPayments: () => Promise<void>;
  addPayment: (d: PaymentDraft) => Promise<void>;
  updatePayment: (id: string, patch: Partial<PaymentDraft>) => Promise<void>;
}

export const createPaymentSlice: StateCreator<StoreState, [], [], PaymentSlice> = (set, get) => ({
  payments: [],
  fetchPayments: async () => set({ payments: await paymentsApi.getPayments() }),
  addPayment: async (d) => {
    const created = await paymentsApi.createPayment(d);
    set((s) => ({ payments: [created, ...s.payments] }));
  },
  updatePayment: async (id, patch) => {
    const updated = await paymentsApi.updatePayment(id, patch);
    set((s) => ({ payments: s.payments.map((p) => (p.id === id ? updated : p)) }));
    if (patch.status === 'Overdue') get().refreshNotifications();
  },
});
