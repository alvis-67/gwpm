const MARK = "[[gwpm:v1]]";

export interface ProjectComment {
  id: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface ProjectDocs {
  text: string;
  quotationNumber: string;
  invoiceNumber: string;
  leadUserId: string;
  /** People who can be chosen as 負責人 on this project only. */
  assigneeIds: string[];
  comments: ProjectComment[];
}

function emptyDocs(text: string): ProjectDocs {
  return { text, quotationNumber: "", invoiceNumber: "", leadUserId: "", assigneeIds: [], comments: [] };
}

function readIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item !== "" && !ids.includes(item)) ids.push(item);
  }
  return ids;
}

function readComments(value: unknown): ProjectComment[] {
  if (!Array.isArray(value)) return [];
  const comments: ProjectComment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const authorUserId = typeof row.authorUserId === "string" ? row.authorUserId : "";
    const body = typeof row.body === "string" ? row.body : "";
    const createdAt = typeof row.createdAt === "string" ? row.createdAt : "";
    if (!id || !authorUserId || !body || !createdAt) continue;
    comments.push({ id, authorUserId, body, createdAt });
  }
  return comments;
}

/** Quotation numbers, the project 負責人, and project comments live in notes so they survive the current data store. */
export function splitProjectNotes(notes: string): ProjectDocs {
  const idx = notes.indexOf(MARK);
  if (idx === -1) return emptyDocs(notes);
  const text = notes.slice(0, idx).replace(/\n+$/, "");
  try {
    const parsed = JSON.parse(notes.slice(idx + MARK.length)) as {
      quotationNumber?: unknown;
      invoiceNumber?: unknown;
      leadUserId?: unknown;
      assigneeIds?: unknown;
      comments?: unknown;
    };
    return {
      text,
      quotationNumber: typeof parsed.quotationNumber === "string" ? parsed.quotationNumber : "",
      invoiceNumber: typeof parsed.invoiceNumber === "string" ? parsed.invoiceNumber : "",
      leadUserId: typeof parsed.leadUserId === "string" ? parsed.leadUserId : "",
      assigneeIds: readIds(parsed.assigneeIds),
      comments: readComments(parsed.comments),
    };
  } catch {
    return emptyDocs(notes);
  }
}

export function joinProjectNotes(
  text: string,
  quotationNumber: string,
  invoiceNumber: string,
  extra?: { leadUserId?: string; assigneeIds?: string[]; comments?: ProjectComment[] },
): string {
  const quotation = quotationNumber.trim();
  const invoice = invoiceNumber.trim();
  const leadUserId = extra?.leadUserId?.trim() || "";
  const assigneeIds = readIds(extra?.assigneeIds);
  const comments = extra?.comments ?? [];
  const body = text.replace(/\s+$/, "");
  if (!quotation && !invoice && !leadUserId && assigneeIds.length === 0 && comments.length === 0) {
    return body;
  }
  const payload: Record<string, unknown> = {
    quotationNumber: quotation,
    invoiceNumber: invoice,
  };
  if (leadUserId) payload.leadUserId = leadUserId;
  if (assigneeIds.length > 0) payload.assigneeIds = assigneeIds;
  if (comments.length > 0) payload.comments = comments;
  return `${body}${body ? "\n\n" : ""}${MARK}${JSON.stringify(payload)}`;
}

/** Unencoded path. Next encodes the segment once; encoding here makes the link double-encoded. */
export function customerPath(name: string): string {
  const key = name.trim() || "_";
  return `/customers/${key.split("/").join("")}`;
}

export function customerNameFromPath(key: string): string {
  let name = key;
  for (let i = 0; i < 2 && name.includes("%"); i += 1) {
    try {
      const decoded = decodeURIComponent(name);
      if (decoded === name) break;
      name = decoded;
    } catch {
      break;
    }
  }
  return name === "_" ? "" : name;
}
