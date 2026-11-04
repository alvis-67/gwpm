import { buildSeedData } from "./seed";
import {
  fromSupabasePayload,
  toSupabasePayload,
  type SupabasePayload,
} from "./supabase-data";
import {
  SUPABASE_UPLOAD_BUCKET,
  getSupabaseAdmin,
} from "./supabase";
import type { AppData } from "./types";

const revisions = new WeakMap<AppData, number>();

export function tagRevision(data: AppData, revision: number): void {
  revisions.set(data, revision);
}

/** Revision captured when this object was loaded. Null means overwrite (seed reset). */
export function revisionOf(data: AppData): number | null {
  return revisions.has(data) ? revisions.get(data)! : null;
}

type PostgrestError = { message?: string; code?: string };

export function isRevisionConflict(error: unknown): boolean {
  return error instanceof Error && error.name === "RevisionConflict";
}

function wrapSupabaseError(error: PostgrestError, action: string): Error {
  const message = error.message || "未知錯誤";
  if (error.code === "40001" || message.includes("revision_conflict")) {
    const conflict = new Error("revision_conflict");
    conflict.name = "RevisionConflict";
    return conflict;
  }
  if (/schema cache|does not exist|gwpm_load_data|gwpm_replace_data/i.test(message)) {
    return new Error(
      `Supabase 尚未建立 Gwpm 函式。請在 SQL Editor 執行 supabase/schema.sql。（${message}）`,
    );
  }
  return new Error(`Supabase ${action}失敗：${message}`);
}

export async function fetchSupabaseState(): Promise<{ data: AppData; revision: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase 未設定");
  const { data, error } = await supabase.rpc("gwpm_load_data");
  if (error) throw wrapSupabaseError(error, "讀取");
  return fromSupabasePayload(data);
}

export async function commitSupabase(
  data: AppData,
  expectedRevision: number | null,
): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase 未設定");
  const payload: SupabasePayload = toSupabasePayload(data);
  const { data: revision, error } = await supabase.rpc("gwpm_replace_data", {
    payload,
    expected_revision: expectedRevision,
  });
  if (error) throw wrapSupabaseError(error, "寫入");
  const next = Number(revision);
  if (!Number.isFinite(next)) throw new Error("Supabase 寫入沒有回傳版本號");
  return next;
}

/**
 * Load every tenant. The signed-in session's org filter stays in the app.
 * Service role bypasses RLS; the anon key has no policies.
 * An empty database is seeded once (same demo companies as the JSON store).
 */
export async function readSupabaseData(): Promise<AppData> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const loaded = await fetchSupabaseState();
    if (loaded.data.organizations.length > 0) {
      tagRevision(loaded.data, loaded.revision);
      return loaded.data;
    }
    const seed = await buildSeedData();
    try {
      const revision = await commitSupabase(seed, loaded.revision);
      tagRevision(seed, revision);
      return seed;
    } catch (error) {
      if (!isRevisionConflict(error) || attempt === 4) throw error;
    }
  }
  throw new Error("Supabase 初始化失敗");
}

export async function saveSupabaseUpload(
  filename: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase 未設定");
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "photo.jpg";
  const objectPath = `uploads/${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${safe}`;
  const { error } = await supabase.storage
    .from(SUPABASE_UPLOAD_BUCKET)
    .upload(objectPath, new Uint8Array(bytes), {
      contentType: contentType || "image/jpeg",
      upsert: false,
    });
  if (error) {
    throw new Error(
      `無法儲存相片（${error.message}）。請確認已執行 supabase/schema.sql，並已建立 ${SUPABASE_UPLOAD_BUCKET} bucket。`,
    );
  }
  return `sb:${objectPath}`;
}

/** Stored photo locator, or a legacy public object URL. Rejects path traversal. */
export function supabaseObjectPath(stored: string): string | null {
  let raw = "";
  if (stored.startsWith("sb:")) raw = stored.slice(3);
  else {
    for (const kind of ["public", "authenticated"]) {
      const marker = `/object/${kind}/${SUPABASE_UPLOAD_BUCKET}/`;
      const index = stored.indexOf(marker);
      if (index >= 0) {
        raw = stored.slice(index + marker.length);
        break;
      }
    }
  }
  const objectPath = decodeURIComponent(raw.split("?")[0] || "");
  if (!objectPath || objectPath.includes("..") || objectPath.startsWith("/") || objectPath.includes("\\")) {
    return null;
  }
  return objectPath;
}

export async function downloadSupabaseObject(
  objectPath: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(SUPABASE_UPLOAD_BUCKET).download(objectPath);
  if (error || !data) return null;
  return {
    bytes: Buffer.from(await data.arrayBuffer()),
    contentType: data.type || "application/octet-stream",
  };
}

export async function deleteSupabaseObject(objectPath: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.storage.from(SUPABASE_UPLOAD_BUCKET).remove([objectPath]);
}
