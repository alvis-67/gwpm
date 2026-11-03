import type { AppData, NotificationType } from "./types";
import { createId } from "./ids";

export function pushNotification(
  data: AppData,
  input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    entityType: string;
    entityId: string;
    href: string;
  },
) {
  data.notifications.unshift({
    id: createId("ntf"),
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    entityType: input.entityType,
    entityId: input.entityId,
    href: input.href,
    readAt: null,
    createdAt: new Date().toISOString(),
  });
}

export function unreadCount(data: AppData, userId: string): number {
  return data.notifications.filter((n) => n.userId === userId && !n.readAt)
    .length;
}
