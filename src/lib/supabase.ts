/**
 * Server-side Supabase client.
 *
 * The data layer connects only when both of these are set:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server only — never NEXT_PUBLIC, never commit)
 *
 * Set them in Vercel (Project → Settings → Environment Variables, Production
 * and Preview) and in local `.env.local`. Until both are present the app
 * keeps the JSON / Blob store and is not connected to a live database.
 *
 * NEXT_PUBLIC_SUPABASE_ANON_KEY and DATABASE_URL are optional. This server
 * path does not read them: RLS denies the anon key, and queries go through
 * supabase-js with the service role. DATABASE_URL is for psql only.
 */
import { existsSync, readFileSync } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_ENV = {
  url: "NEXT_PUBLIC_SUPABASE_URL",
  serviceRoleKey: "SUPABASE_SERVICE_ROLE_KEY",
  anonKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  databaseUrl: "DATABASE_URL",
} as const;

export const SUPABASE_UPLOAD_BUCKET = "gwpm-uploads";

let adminClient: SupabaseClient | null = null;
let envFilesLoaded = false;

function loadEnvFile(filename: string): void {
  const full = path.join(process.cwd(), filename);
  if (!existsSync(full)) return;
  const text = readFileSync(full, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const normalized = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length).trim()
      : trimmed;
    const eq = normalized.indexOf("=");
    if (eq < 1) continue;
    const key = normalized.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] !== undefined) continue;
    let value = normalized.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

/** Next.js loads env for `next dev`. Seed / tsx does not, so fill gaps from local files. */
export function loadLocalEnvFiles(): void {
  if (envFilesLoaded) return;
  envFilesLoaded = true;
  if (typeof window !== "undefined") return;
  loadEnvFile(".env.local");
  loadEnvFile(".env");
}

loadLocalEnvFiles();

export function missingSupabaseEnv(): string[] {
  const missing: string[] = [];
  if (!process.env[SUPABASE_ENV.url]) missing.push(SUPABASE_ENV.url);
  if (!process.env[SUPABASE_ENV.serviceRoleKey]) missing.push(SUPABASE_ENV.serviceRoleKey);
  return missing;
}

export function supabaseConfigured(): boolean {
  return missingSupabaseEnv().length === 0;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  if (adminClient) return adminClient;
  const url = process.env[SUPABASE_ENV.url]!;
  const key = process.env[SUPABASE_ENV.serviceRoleKey]!;
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
