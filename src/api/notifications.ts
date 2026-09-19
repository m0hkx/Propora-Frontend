import type { AppNotification } from '../data/mock';
import { relativeTime } from '../lib/format';
import { apiFetch, stripNulls } from './config';

type NotificationDoc = AppNotification;

function toNotification(rawDoc: NotificationDoc): AppNotification {
    const doc = stripNulls(rawDoc);
    return { ...doc, time: relativeTime(doc.time) };
}

export async function getNotifications(): Promise<AppNotification[]> {
    const data = await apiFetch<{ notifications: NotificationDoc[] }>('/notifications');
    return data.notifications.map(toNotification);
}

export async function markNotificationAsRead(id: string): Promise<void> {
    await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsAsRead(): Promise<void> {
    await apiFetch('/notifications/read-all', { method: 'PATCH' });
}
