import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "./types";
import { readData } from "./store";

const COOKIE = "gwpm_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "gwpm-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phoneE164: string;
  roleDefault: Role;
}

export async function createSession(user: User): Promise<void> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    phoneE164: user.phoneE164,
    roleDefault: user.roleDefault,
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

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      phoneE164: String(payload.phoneE164 || ""),
      roleDefault: payload.roleDefault as Role,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
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
  const match = await compare(password, user.passwordHash);
  if (!match) return { ok: false, error: "電郵或密碼不正確" };
  await createSession(user);
  return { ok: true, user };
}

export function isOwner(user: SessionUser): boolean {
  return user.roleDefault === "owner";
}
