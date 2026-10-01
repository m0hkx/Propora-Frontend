import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { AppNotification, ChatMessage, Conversation } from '../../types';
import * as notificationsApi from '../../api/notifications';
import { conversations as seedConversations } from '../../data/conversations';

let messageSeq = 100;

export interface InboxSlice {
  notifications: AppNotification[];
  fetchNotifications: () => Promise<void>;
  /**
   * Background re-fetch after a write that may have created notifications. The write
   * itself already succeeded, so a failure here is logged rather than surfaced.
   */
  refreshNotifications: () => void;
  /**
   * Optimistic: the badge updates before the request. On failure the affected
   * notifications are flipped back to unread and the error is rethrown for the caller.
   */
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Inbox/chat has no backend resource yet; it seeds from src/data/conversations.ts.
  conversations: Conversation[];
  markConversationRead: (id: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
}

export const createInboxSlice: StateCreator<StoreState, [], [], InboxSlice> = (set, get) => {
  // Touches only the given ids, so a rollback can't clobber a fetch that landed meanwhile.
  const setRead = (ids: Set<string>, read: boolean) =>
    set((s) => ({ notifications: s.notifications.map((n) => (ids.has(n.id) ? { ...n, read } : n)) }));

  const unreadIds = (match: (id: string) => boolean) =>
    new Set(get().notifications.filter((n) => !n.read && match(n.id)).map((n) => n.id));

  const markRead = async (ids: Set<string>, request: () => Promise<void>) => {
    if (ids.size === 0) return;
    setRead(ids, true);
    try {
      await request();
    } catch (error) {
      setRead(ids, false);
      throw error;
    }
  };

  return {
    notifications: [],
    fetchNotifications: async () => set({ notifications: await notificationsApi.getNotifications() }),
    refreshNotifications: () => {
      get().fetchNotifications().catch((err) => console.error('[notifications] refresh failed', err));
    },
    markNotificationRead: (id) =>
      markRead(unreadIds((n) => n === id), () => notificationsApi.markNotificationAsRead(id)),
    markAllNotificationsRead: () =>
      markRead(unreadIds(() => true), () => notificationsApi.markAllNotificationsAsRead()),

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
  };
};
