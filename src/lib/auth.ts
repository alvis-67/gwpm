import { createHash } from "crypto";
import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { accountStatusOf, passwordHashForCompare } from "./account-status";
import type { Role, User } from "./types";
import { readData } from "./store";

const COOKIE = "gwpm_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET 未設定");
  return new TextEncoder().encode(secret);
}

function passwordStamp(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("base64url");
}

export interface SessionUser {
  id: string;
  orgId: string;
  email: string;
  name: string;
  companyName: string;
  phoneE164: string;
  roleDefault: Role;
}

export async function createSession(user: User): Promise<void> {
  const token = await new SignJWT({
    id: user.id,
    orgId: user.orgId,
    email: user.email,
    name: user.name,
    companyName: user.companyName || "",
    phoneE164: user.phoneE164,
    roleDefault: user.roleDefault,
    pwd: passwordStamp(user.passwordHash),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

function sessionFromUser(user: User): SessionUser {
  return {
    id: user.id,
    orgId: user.orgId,
    email: user.email,
    name: user.name,
    companyName: user.companyName || "",
    phoneE164: user.phoneE164,
    roleDefault: user.roleDefault,
  };
}

/**
 * The cookie is accepted only when the account still exists, the role is unchanged,
 * and the password stamp still matches. A deleted Leader cannot keep the old login.
 */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const data = await readData();
    const user = data.users.find((item) => item.id === String(payload.id));
    const stamp = typeof payload.pwd === "string" ? payload.pwd : "";
    if (
      !user ||
      user.roleDefault !== payload.roleDefault ||
      passwordStamp(user.passwordHash) !== stamp ||
      accountStatusOf(user) !== "approved"
    ) {
      return null;
    }
    return sessionFromUser(user);
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_SECRET 未設定") throw error;
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !session.orgId) {
    try {
      await destroySession();
    } catch {
      // A Server Component cannot always clear the cookie. Login replaces it.
    }
    redirect("/login");
  }
  return session;
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const data = await readData();
  const user = data.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!user) return { ok: false, error: "電郵或密碼不正確" };
  const match = await compare(password, passwordHashForCompare(user.passwordHash));
  if (!match) return { ok: false, error: "電郵或密碼不正確" };
  const status = accountStatusOf(user);
  if (status === "pending") return { ok: false, error: "帳號尚未由管理員核准" };
  if (status === "rejected") return { ok: false, error: "帳號未獲核准" };
  await createSession(user);
  return { ok: true, user };
}

export function isAdmin(user: { roleDefault: Role }): boolean {
  return user.roleDefault === "admin";
}

export function isOwner(user: { roleDefault: Role }): boolean {
  return user.roleDefault === "owner";
}

/** Company account tasks, such as partners. Creating a project is any login; that person becomes its Leader. */
export function canManageProjects(user: { roleDefault: Role }): boolean {
  return isAdmin(user) || isOwner(user);
}
