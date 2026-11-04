const TRADE_MARK = "[[gwpm:amt]]";

export function parseAmount(raw: unknown): number | null {
  const text = String(raw ?? "").trim().replace(/,/g, "");
  if (!text) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error("請輸入數字");
  return Math.round(Number(text) * 100) / 100;
}

export function formatAmount(value: number | null): string {
  if (value == null) return "未填";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function readStoredAmount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

export function splitTradeNotes(notes: string): { text: string; amount: number | null } {
  const idx = notes.indexOf(TRADE_MARK);
  if (idx === -1) return { text: notes, amount: null };
  const text = notes.slice(0, idx).replace(/\n+$/, "");
  try {
    const parsed = JSON.parse(notes.slice(idx + TRADE_MARK.length)) as { amount?: unknown };
    return { text, amount: readStoredAmount(parsed.amount) };
  } catch {
    return { text: notes, amount: null };
  }
}

export function joinTradeNotes(text: string, amount: number | null): string {
  const body = text.replace(/\s+$/, "");
  const stored = amount == null ? null : readStoredAmount(amount);
  if (stored == null) return body;
  return `${body}${body ? "\n\n" : ""}${TRADE_MARK}${JSON.stringify({ amount: stored })}`;
}

export function addAmounts(values: number[]): number {
  const cents = values.reduce((sum, value) => sum + Math.round(value * 100), 0);
  return cents / 100;
}

export function summarizeTradeAmounts(notes: string[]): {
  tradeTotal: number | null;
  remainder: (customerPayment: number | null) => number | null;
} {
  const amounts = notes
    .map((item) => splitTradeNotes(item).amount)
    .filter((amount): amount is number => amount != null);
  const tradeTotal = amounts.length === 0 ? null : addAmounts(amounts);
  return {
    tradeTotal,
    remainder(customerPayment) {
      if (customerPayment == null) return null;
      return addAmounts([customerPayment, -(tradeTotal ?? 0)]);
    },
  };
}
