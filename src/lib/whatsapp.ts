export function toWaMeNumber(phoneE164: string): string | null {
  const digits = phoneE164.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return digits;
}

export function buildTomorrowEntryMessage(params: {
  projectName: string;
  tradeName: string;
  date: string;
  location?: string;
}): string {
  const lines = [
    `【進場提醒】明日（${params.date}）請負責「${params.tradeName}」進場。`,
    `工程：${params.projectName}`,
  ];
  if (params.location) lines.push(`地點：${params.location}`);
  lines.push("如有問題請於系統留言或致電聯絡。");
  return lines.join("\n");
}

export function buildWhatsAppUrl(phoneE164: string, text: string): string | null {
  const num = toWaMeNumber(phoneE164);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
