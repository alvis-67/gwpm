import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { canAccessTrade } from "@/lib/permissions";
import { readData } from "@/lib/store";
import { readStoredUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSession();
  const { id } = await context.params;
  const data = await readData();
  const photo = data.photos.find((item) => item.id === id);
  const log = photo ? data.workLogs.find((item) => item.id === photo.workLogId) : undefined;
  const trade = log ? data.trades.find((item) => item.id === log.projectTradeId) : undefined;
  if (!photo || !trade || !canAccessTrade(data, user, trade)) {
    return new NextResponse(null, { status: 404 });
  }
  const file = await readStoredUpload(photo.url);
  if (!file) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
