import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { AppNotification, ChatMessage, Conversation } from '../../types';
import * as notificationsApi from '../../api/notifications';
import { conversations as seedConversations } from '../../data/conversations';

let messageSeq = 100;

export interface InboxSlice {
  notifications: AppNotification[];
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Inbox/chat has no backend resource yet; it seeds from src/data/conversations.ts.
  conversations: Conversation[];
  markConversationRead: (id: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
}

export const createInboxSlice: StateCreator<StoreState, [], [], InboxSlice> = (set) => ({
  notifications: [],
  fetchNotifications: async () => set({ notifications: await notificationsApi.getNotifications() }),
  markNotificationRead: async (id) => {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    await notificationsApi.markNotificationAsRead(id);
  },
  markAllNotificationsRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    await notificationsApi.markAllNotificationsAsRead();
  },

  conversations: seedConversations,
  markConversationRead: (id) =>
    set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) })),
  sendMessage: (conversationId, text) => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    const message: ChatMessage = { id: `m-${messageSeq++}`, from: 'me', text: trimmed, time: 'Now' };
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, messages: [...c.messages, message] } : c
      ),
    }));
  },
});
