import { ADMIN_EMAIL } from "./admin-account";
import type { AppData } from "./types";

/** Logins removed from the product. Matched case-insensitively. */
export const REMOVED_DEMO_EMAILS = [
  "owner@demo.local",
  "paint@demo.local",
  "plumb@demo.local",
  "other@demo.local",
] as const;

const removedEmails = new Set<string>(REMOVED_DEMO_EMAILS);

export function hasRemovedDemoAccount(data: AppData): boolean {
  return data.users.some((user) => removedEmails.has(user.email.toLowerCase()));
}

/** Drop the retired demo logins and keep remaining rows referentially valid. */
export function stripRemovedDemoAccounts(data: AppData): boolean {
  const removedIds = new Set(
    data.users
      .filter((user) => removedEmails.has(user.email.toLowerCase()))
      .map((user) => user.id),
  );
  if (removedIds.size === 0) return false;

  data.users = data.users.filter((user) => !removedIds.has(user.id));
  const fallbackAuthorId =
    data.users.find((user) => user.email.toLowerCase() === ADMIN_EMAIL)?.id ?? null;

  for (const trade of data.trades) {
    if (trade.assigneeUserId && removedIds.has(trade.assigneeUserId)) {
      trade.assigneeUserId = null;
    }
  }

  if (fallbackAuthorId) {
    for (const log of data.workLogs) {
      if (removedIds.has(log.authorUserId)) log.authorUserId = fallbackAuthorId;
    }
    for (const comment of data.comments) {
      if (removedIds.has(comment.authorUserId)) comment.authorUserId = fallbackAuthorId;
    }
  } else {
    const logIds = new Set(
      data.workLogs.filter((log) => removedIds.has(log.authorUserId)).map((log) => log.id),
    );
    data.workLogs = data.workLogs.filter((log) => !removedIds.has(log.authorUserId));
    data.photos = data.photos.filter((photo) => !logIds.has(photo.workLogId));
    data.comments = data.comments.filter((comment) => !removedIds.has(comment.authorUserId));
  }

  data.notifications = data.notifications.filter(
    (notification) => !removedIds.has(notification.userId),
  );
  return true;
}
