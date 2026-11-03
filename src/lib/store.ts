import { put, list, del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { AppData } from "./types";
import { buildSeedData } from "./seed";

const LOCAL_DATA_PATH = path.join(process.cwd(), "data", "gwpm.json");
const BLOB_PATHNAME = "gwpm-data.json";

const globalForStore = globalThis as unknown as {
  __gwpmMemory?: AppData;
  __gwpmWriteLock?: Promise<void>;
};

function blobStoreEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function ensureLocalDir() {
  await fs.mkdir(path.dirname(LOCAL_DATA_PATH), { recursive: true });
}

async function readFromLocal(): Promise<AppData | null> {
  try {
    const raw = await fs.readFile(LOCAL_DATA_PATH, "utf8");
    return JSON.parse(raw) as AppData;
  } catch {
    return null;
  }
}

async function writeToLocal(data: AppData): Promise<void> {
  await ensureLocalDir();
  await fs.writeFile(LOCAL_DATA_PATH, JSON.stringify(data, null, 2), "utf8");
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

export async function readData(): Promise<AppData> {
  if (globalForStore.__gwpmMemory) {
    return structuredClone(globalForStore.__gwpmMemory);
  }

  let data: AppData | null = null;
  if (blobStoreEnabled()) {
    data = await readFromBlob();
  } else {
    data = await readFromLocal();
  }

  if (!data) {
    data = await buildSeedData();
    await writeData(data);
  }

  globalForStore.__gwpmMemory = structuredClone(data);
  return structuredClone(data);
}

export async function writeData(data: AppData): Promise<void> {
  const next = structuredClone(data);
  globalForStore.__gwpmMemory = next;

  const run = async () => {
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
  const data = await readData();
  await mutator(data);
  await writeData(data);
  return data;
}

export async function resetData(): Promise<AppData> {
  const data = await buildSeedData();
  await writeData(data);
  return data;
}

export function isUsingBlobStore(): boolean {
  return blobStoreEnabled();
}

export async function saveUpload(
  filename: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  if (blobStoreEnabled()) {
    const blob = await put(`uploads/${filename}`, bytes, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalName = `${Date.now()}_${safe}`;
  await fs.writeFile(path.join(uploadsDir, finalName), bytes);
  return `/uploads/${finalName}`;
}
