import type { Payment } from '../data/mock';
import type { PaymentDraft } from '../pages/Payments/RecordPaymentModal';
import { apiFetch, stripNulls } from './config';

type PaymentDoc = Payment;

function toPayment(doc: PaymentDoc): Payment {
    return stripNulls(doc);
}

export async function getPayments(): Promise<Payment[]> {
    const data = await apiFetch<{ payments: PaymentDoc[] }>('/payments');
    return data.payments.map(toPayment);
}

export async function createPayment(d: PaymentDraft & { leaseId?: string; period?: string }): Promise<Payment> {
    const data = await apiFetch<{ payment: PaymentDoc }>('/payments', {
        method: 'POST',
        body: JSON.stringify(d),
    });
    return toPayment(data.payment);
}

export async function updatePayment(id: string, patch: Partial<PaymentDraft>): Promise<Payment> {
    const data = await apiFetch<{ payment: PaymentDoc }>(`/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
    });
    return toPayment(data.payment);
}

export async function deletePayment(id: string): Promise<void> {
    await apiFetch(`/payments/${id}`, { method: 'DELETE' });
}
