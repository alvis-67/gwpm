import {
  ADMIN_EMAIL,
  ADMIN_ORG_ID,
  ADMIN_PASSWORD_HASH,
  ADMIN_USER_ID,
} from "./admin-account";
import type { AppData } from "./types";

export function platformAdminPresent(data: AppData): boolean {
  return data.users.some((user) => user.email.toLowerCase() === ADMIN_EMAIL);
}

/** Add the platform admin when an existing database was seeded before that account. */
export function addPlatformAdmin(data: AppData): void {
  if (platformAdminPresent(data)) return;
  const now = new Date().toISOString();
  if (!data.organizations.some((org) => org.id === ADMIN_ORG_ID)) {
    data.organizations.push({
      id: ADMIN_ORG_ID,
      name: "Gwpm",
      createdAt: now,
    });
  }
  const id = data.users.some((user) => user.id === ADMIN_USER_ID)
    ? `${ADMIN_USER_ID}_${Date.now()}`
    : ADMIN_USER_ID;
  data.users.push({
    id,
    orgId: ADMIN_ORG_ID,
    email: ADMIN_EMAIL,
    name: "系統管理員",
    companyName: "Gwpm",
    phoneE164: "",
    roleDefault: "admin",
    passwordHash: ADMIN_PASSWORD_HASH,
    createdAt: now,
  });
}
