/** Platform administrator. The password hash lives in the database, not in source. */
export const ADMIN_EMAIL = "admin@gwpm.com";
export const ADMIN_USER_ID = "user_gwpm_admin";
export const ADMIN_ORG_ID = "org_gwpm";

/** Used only when creating a missing admin. Never commit a hash. */
export function adminPasswordHashFromEnv(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim() || "";
  if (!hash) throw new Error("ADMIN_PASSWORD_HASH 未設定");
  return hash;
}
