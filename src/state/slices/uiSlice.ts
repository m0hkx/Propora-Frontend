import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';

export interface Toast {
  id: number;
  message: string;
}

let toastSeq = 1;

export interface UiSlice {
  toasts: Toast[];
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
}

export const createUiSlice: StateCreator<StoreState, [], [], UiSlice> = (set, get) => ({
  toasts: [],
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  pushToast: (message) => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message }] }));
    window.setTimeout(() => get().dismissToast(id), 3500);
  },
});
