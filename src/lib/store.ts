import { put, list, del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { AppData } from "./types";
import { buildSeedData } from "./seed";
import { supabaseConfigured } from "./supabase";
import {
  commitSupabase,
  isRevisionConflict,
  readSupabaseData,
  revisionOf,
  saveSupabaseUpload,
  tagRevision,
} from "./supabase-store";

const LOCAL_DATA_PATH = path.join(process.cwd(), "data", "gwpm.json");
const TMP_DATA_PATH = path.join("/tmp", "gwpm.json");
const BLOB_PATHNAME = "gwpm-data.json";

const globalForStore = globalThis as unknown as {
  __gwpmMemory?: AppData;
  __gwpmWriteLock?: Promise<void>;
};

function blobStoreEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function onVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

async function readFromLocal(): Promise<AppData | null> {
  for (const p of [TMP_DATA_PATH, LOCAL_DATA_PATH]) {
    try {
      const raw = await fs.readFile(p, "utf8");
      return JSON.parse(raw) as AppData;
    } catch {
      // try next
    }
  }
  return null;
}

async function writeToLocal(data: AppData): Promise<void> {
  const payload = JSON.stringify(data, null, 2);
  // Prefer project data/ locally; on Vercel serverless FS is read-only → /tmp + memory
  const targets = onVercel()
    ? [TMP_DATA_PATH]
    : [LOCAL_DATA_PATH, TMP_DATA_PATH];
  let wrote = false;
  for (const p of targets) {
    try {
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, payload, "utf8");
      wrote = true;
      break;
    } catch {
      // try next
    }
  }
  if (!wrote) {
    // Memory already updated by writeData; tolerate ephemeral environments
    console.warn("[gwpm] persist skipped; using in-memory store for this instance");
  }
}

async function readFromBlob(): Promise<AppData | null> {
  try {
    const result = await list({ prefix: BLOB_PATHNAME, limit: 10 });
    const blob = result.blobs.find((b) => b.pathname === BLOB_PATHNAME);
    if (!blob) return null;
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as AppData;
  } catch {
    return null;
  }
}

async function writeToBlob(data: AppData): Promise<void> {
  // Replace previous blob object(s) with same pathname
  try {
    const existing = await list({ prefix: BLOB_PATHNAME, limit: 20 });
    await Promise.all(
      existing.blobs
        .filter((b) => b.pathname === BLOB_PATHNAME)
        .map((b) => del(b.url)),
    );
  } catch {
    // ignore cleanup errors
  }
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function needsReseed(data: AppData | null): boolean {
  if (!data) return true;
  if (data.version !== 2) return true;
  if (!Array.isArray(data.organizations) || data.organizations.length === 0) {
    return true;
  }
  return false;
}

function normalizeData(data: AppData): AppData {
  if (!Array.isArray(data.organizations)) data.organizations = [];
  for (const user of data.users) {
    if (typeof user.companyName !== "string") user.companyName = "";
    if (typeof user.orgId !== "string") user.orgId = "";
  }
  for (const project of data.projects) {
    if (typeof project.orgId !== "string") project.orgId = "";
  }
  return data;
}

export async function readData(): Promise<AppData> {
  if (supabaseConfigured()) {
    return readSupabaseData();
  }

  if (globalForStore.__gwpmMemory && !needsReseed(globalForStore.__gwpmMemory)) {
    return structuredClone(normalizeData(globalForStore.__gwpmMemory));
  }

  let data: AppData | null = null;
  if (blobStoreEnabled()) {
    data = await readFromBlob();
  } else {
    data = await readFromLocal();
  }

  if (needsReseed(data)) {
    data = await buildSeedData();
    await writeData(data);
  } else {
    data = normalizeData(data!);
  }

  globalForStore.__gwpmMemory = structuredClone(data);
  return structuredClone(data);
}

export async function writeData(data: AppData): Promise<void> {
  const next = structuredClone(data);
  const useSupabase = supabaseConfigured();
  const supabaseRevision = useSupabase ? revisionOf(data) : null;
  if (!useSupabase) {
    globalForStore.__gwpmMemory = next;
  }

  const run = async () => {
    if (useSupabase) {
      const nextRev = await commitSupabase(next, supabaseRevision);
      tagRevision(next, nextRev);
      tagRevision(data, nextRev);
      return;
    }
    if (blobStoreEnabled()) {
      await writeToBlob(next);
    } else {
      await writeToLocal(next);
    }
  };

  const prev = globalForStore.__gwpmWriteLock ?? Promise.resolve();
  let release!: () => void;
  globalForStore.__gwpmWriteLock = new Promise<void>((r) => {
    release = r;
  });
  await prev;
  try {
    await run();
  } finally {
    release();
  }
}

export async function updateData(
  mutator: (data: AppData) => void | Promise<void>,
): Promise<AppData> {
  if (!supabaseConfigured()) {
    const data = await readData();
    await mutator(data);
    await writeData(data);
    return data;
  }

  let last: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    const data = await readData();
    await mutator(data);
    try {
      await writeData(data);
      return data;
    } catch (error) {
      last = error;
      if (!isRevisionConflict(error) || attempt === 4) throw error;
    }
  }
  throw last instanceof Error ? last : new Error("資料寫入衝突，請再試一次");
}

export async function resetData(): Promise<AppData> {
  const data = await buildSeedData();
  await writeData(data);
  return data;
}

export type PersistenceMode = "supabase" | "blob" | "local";

export function persistenceMode(): PersistenceMode {
  if (supabaseConfigured()) return "supabase";
  if (blobStoreEnabled()) return "blob";
  return "local";
}

export function persistenceLabel(mode: PersistenceMode = persistenceMode()): string {
  if (mode === "supabase") return "Supabase（多租戶）";
  if (mode === "blob") return "Vercel Blob（可寫）";
  return "本地 JSON（未連接 Supabase）";
}

export function isUsingBlobStore(): boolean {
  return persistenceMode() === "blob";
}

export async function saveUpload(
  filename: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  if (supabaseConfigured()) {
    return saveSupabaseUpload(filename, bytes, contentType);
  }

  if (blobStoreEnabled()) {
    const blob = await put(`uploads/${filename}`, bytes, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalName = `${Date.now()}_${safe}`;
  const dirs = onVercel()
    ? [path.join("/tmp", "uploads")]
    : [path.join(process.cwd(), "public", "uploads"), path.join("/tmp", "uploads")];

  for (const uploadsDir of dirs) {
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(path.join(uploadsDir, finalName), bytes);
      if (uploadsDir.startsWith("/tmp")) {
        // Serve via data URL fallback is not ideal; require Blob for durable photos on Vercel
        return `data:${contentType};base64,${bytes.toString("base64")}`;
      }
      return `/uploads/${finalName}`;
    } catch {
      // try next
    }
  }
  throw new Error("無法儲存相片（請設定 BLOB_READ_WRITE_TOKEN）");
}
