import Link from "next/link";
import { notFound } from "next/navigation";
import { addWorkLogAction } from "@/actions/trades";
import { SubmitButton } from "@/components/SubmitButton";
import { requireSession } from "@/lib/auth";
import { formatDateTimeZh } from "@/lib/dates";
import { canAccessTrade, canEditTrade } from "@/lib/permissions";
import { readData } from "@/lib/store";

export default async function TradeLogsPage({
  params,
}: {
  params: Promise<{ id: string; tradeId: string }>;
}) {
  const { id, tradeId } = await params;
  const user = await requireSession();
  const data = await readData();
  const trade = data.trades.find((t) => t.id === tradeId && t.projectId === id);
  if (!trade) notFound();
  if (!canAccessTrade(data, user, trade)) {
    return (
      <div className="page">
        <h1 className="page-title">無權限</h1>
        <p>您沒有權限檢視此工種</p>
        <Link href="/today" className="btn btn-secondary mt-4">
          返回今日
        </Link>
      </div>
    );
  }

  const canEdit = canEditTrade(data, user, trade);
  const logs = data.workLogs
    .filter((l) => l.projectTradeId === tradeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href={`/projects/${id}/trades/${tradeId}`}>{trade.name}</Link>
      </p>
      <h1 className="page-title mb-4">日誌與相片</h1>

      {canEdit && (
        <form action={addWorkLogAction} className="mb-6" encType="multipart/form-data">
          <input type="hidden" name="tradeId" value={tradeId} />
          <div className="field">
            <label htmlFor="body">今日工作內容（必填）</label>
            <textarea id="body" name="body" required placeholder="簡述現場進度…" />
          </div>
          <div className="field">
            <label htmlFor="photos">現場相片（可多選）</label>
            <input id="photos" name="photos" type="file" accept="image/*" multiple capture="environment" />
          </div>
          <SubmitButton label="發表日誌" className="btn btn-primary btn-block md:max-w-xs" />
        </form>
      )}

      {logs.length === 0 ? (
        <div className="empty">尚無日誌</div>
      ) : (
        <div>
          {logs.map((log) => {
            const author = data.users.find((u) => u.id === log.authorUserId);
            const photos = data.photos.filter((p) => p.workLogId === log.id);
            return (
              <article key={log.id} className="timeline-item">
                <div className="flex justify-between gap-2 text-sm secondary">
                  <span>{author?.name}</span>
                  <span className="font-mono">{formatDateTimeZh(log.createdAt)}</span>
                </div>
                <p className="mt-2 mb-0 whitespace-pre-wrap">{log.body}</p>
                {photos.length > 0 && (
                  <div className="photo-grid">
                    {photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={`/media/photos/${p.id}`} alt="現場相片" loading="lazy" />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
