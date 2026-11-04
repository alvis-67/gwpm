import type { AccountStatus, User } from "./types";

const PENDING_PREFIX = "gwpm-status:pending:";
const REJECTED_PREFIX = "gwpm-status:rejected:";

/**
 * Approval is kept on the password hash as well as `accountStatus`.
 * The live database function still stores only the existing user columns,
 * so a pending or rejected login survives a full replace before schema.sql is re-run.
 * Approved hashes stay ordinary bcrypt and existing sessions keep working.
 */
export function statusFromPasswordHash(passwordHash: string): AccountStatus {
  if (passwordHash.startsWith(PENDING_PREFIX)) return "pending";
  if (passwordHash.startsWith(REJECTED_PREFIX)) return "rejected";
  return "approved";
}

export function accountStatusOf(
  user: Pick<User, "passwordHash"> & { accountStatus?: AccountStatus },
): AccountStatus {
  if (
    user.accountStatus === "pending" ||
    user.accountStatus === "approved" ||
    user.accountStatus === "rejected"
  ) {
    return user.accountStatus;
  }
  return statusFromPasswordHash(user.passwordHash);
}

export function passwordHashForCompare(passwordHash: string): string {
  if (passwordHash.startsWith(PENDING_PREFIX)) return passwordHash.slice(PENDING_PREFIX.length);
  if (passwordHash.startsWith(REJECTED_PREFIX)) return passwordHash.slice(REJECTED_PREFIX.length);
  return passwordHash;
}

export function encodeAccountPassword(passwordHash: string, status: AccountStatus): string {
  const raw = passwordHashForCompare(passwordHash);
  if (status === "pending") return PENDING_PREFIX + raw;
  if (status === "rejected") return REJECTED_PREFIX + raw;
  return raw;
}

export function applyAccountStatus(user: User, status: AccountStatus): void {
  user.accountStatus = status;
  user.passwordHash = encodeAccountPassword(user.passwordHash, status);
}
