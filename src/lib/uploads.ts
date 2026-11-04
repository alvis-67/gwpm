import { promises as fs } from "fs";
import path from "path";
import { del, get } from "@vercel/blob";
import {
  deleteSupabaseObject,
  downloadSupabaseObject,
  supabaseObjectPath,
} from "./supabase-store";

export type StoredFile = { bytes: Buffer; contentType: string };

const LOCAL_DIRS = [
  path.join(process.cwd(), "data", "uploads"),
  path.join(process.cwd(), "public", "uploads"),
  path.join("/tmp", "uploads"),
];

function localFileName(stored: string): string | null {
  const name = stored.startsWith("file:")
    ? stored.slice("file:".length)
    : stored.startsWith("/uploads/")
      ? stored.slice("/uploads/".length)
      : "";
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return null;
  return name;
}

function contentTypeFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

function readDataUrl(stored: string): StoredFile | null {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(stored);
  if (!match) return null;
  const contentType = match[1] || "application/octet-stream";
  const bytes = match[2] ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3]));
  return { bytes, contentType };
}

function isBlobUrl(stored: string): boolean {
  try {
    return new URL(stored).hostname.endsWith("blob.vercel-storage.com");
  } catch {
    return false;
  }
}

async function readBlob(stored: string): Promise<StoredFile | null> {
  for (const access of ["private", "public"] as const) {
    try {
      const result = await get(stored, { access });
      if (!result || result.statusCode !== 200 || !result.stream) continue;
      const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
      return { bytes, contentType: result.blob.contentType || "application/octet-stream" };
    } catch {
      // Try the other access level. Legacy uploads were public.
    }
  }
  return null;
}

async function readLocal(name: string): Promise<StoredFile | null> {
  for (const dir of LOCAL_DIRS) {
    try {
      const bytes = await fs.readFile(path.join(dir, name));
      return { bytes, contentType: contentTypeFor(name) };
    } catch {
      // try the next directory
    }
  }
  return null;
}

export async function readStoredUpload(stored: string): Promise<StoredFile | null> {
  if (!stored) return null;
  if (stored.startsWith("data:")) return readDataUrl(stored);
  const objectPath = supabaseObjectPath(stored);
  if (objectPath) return downloadSupabaseObject(objectPath);
  const localName = localFileName(stored);
  if (localName) return readLocal(localName);
  if (isBlobUrl(stored)) return readBlob(stored);
  return null;
}

async function deleteLocal(name: string): Promise<void> {
  await Promise.all(
    LOCAL_DIRS.map(async (dir) => {
      try {
        await fs.unlink(path.join(dir, name));
      } catch {
        // already gone
      }
    }),
  );
}

async function deleteOne(stored: string): Promise<void> {
  if (!stored || stored.startsWith("data:")) return;
  const objectPath = supabaseObjectPath(stored);
  if (objectPath) {
    await deleteSupabaseObject(objectPath);
    return;
  }
  const localName = localFileName(stored);
  if (localName) {
    await deleteLocal(localName);
    return;
  }
  if (isBlobUrl(stored)) await del(stored);
}

export async function deleteStoredUploads(stored: string[]): Promise<void> {
  for (const url of stored) {
    try {
      await deleteOne(url);
    } catch (error) {
      console.error(
        "[gwpm] upload delete failed",
        error instanceof Error ? error.message : "delete failed",
      );
    }
  }
}
