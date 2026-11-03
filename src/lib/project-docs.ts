const MARK = "[[gwpm:v1]]";

export interface ProjectDocs {
  text: string;
  quotationNumber: string;
  invoiceNumber: string;
}

/** Quotation and invoice numbers live in project notes so they survive the current data store. */
export function splitProjectNotes(notes: string): ProjectDocs {
  const idx = notes.indexOf(MARK);
  if (idx === -1) {
    return { text: notes, quotationNumber: "", invoiceNumber: "" };
  }
  const text = notes.slice(0, idx).replace(/\n+$/, "");
  try {
    const parsed = JSON.parse(notes.slice(idx + MARK.length)) as {
      quotationNumber?: unknown;
      invoiceNumber?: unknown;
    };
    return {
      text,
      quotationNumber: typeof parsed.quotationNumber === "string" ? parsed.quotationNumber : "",
      invoiceNumber: typeof parsed.invoiceNumber === "string" ? parsed.invoiceNumber : "",
    };
  } catch {
    return { text: notes, quotationNumber: "", invoiceNumber: "" };
  }
}

export function joinProjectNotes(
  text: string,
  quotationNumber: string,
  invoiceNumber: string,
): string {
  const quotation = quotationNumber.trim();
  const invoice = invoiceNumber.trim();
  const body = text.replace(/\s+$/, "");
  if (!quotation && !invoice) return body;
  return `${body}${body ? "\n\n" : ""}${MARK}${JSON.stringify({
    quotationNumber: quotation,
    invoiceNumber: invoice,
  })}`;
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
