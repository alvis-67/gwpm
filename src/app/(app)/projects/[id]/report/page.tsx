import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { TradeStatusChip } from "@/components/StatusChip";
import { requireSession, isOwner } from "@/lib/auth";
import { formatDateTimeZh, formatDateZh } from "@/lib/dates";
import { PRODUCT_NAME, projectStatusLabel, tradeStatusLabel } from "@/lib/labels";
import { canAccessProject } from "@/lib/permissions";
import { readData } from "@/lib/store";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; photos?: string; preview?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireSession();
  if (!isOwner(user)) redirect(`/projects/${id}`);
  const data = await readData();
  if (!canAccessProject(data, user, id)) notFound();
  const project = data.projects.find((p) => p.id === id);
  if (!project) notFound();

  const from = sp.from || project.plannedStart || "";
  const to = sp.to || project.plannedEnd || "";
  const includePhotos = sp.photos === "1";
  const preview = sp.preview === "1";

  const trades = data.trades
    .filter((t) => t.projectId === id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const logs = data.workLogs.filter((l) => {
    const trade = data.trades.find((t) => t.id === l.projectTradeId);
    if (!trade || trade.projectId !== id) return false;
    const day = l.createdAt.slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href={`/projects/${id}`}>{project.name}</Link>
      </p>
      <h1 className="page-title mb-2">匯出客戶進度報告</h1>
      <p className="secondary text-sm mb-6">
        步驟：① 選範圍 ② 預覽 ③ 列印／下載
      </p>

      {!preview ? (
        <form>
          <input type="hidden" name="preview" value="1" />
          <div className="field">
            <label htmlFor="from">開始日期</label>
            <input id="from" name="from" type="date" defaultValue={from} className="font-mono" />
          </div>
          <div className="field">
            <label htmlFor="to">結束日期</label>
            <input id="to" name="to" type="date" defaultValue={to} className="font-mono" />
          </div>
          <div className="field">
            <label htmlFor="photos">現場相片</label>
            <select id="photos" name="photos" defaultValue="1">
              <option value="1">含相片</option>
              <option value="0">不含相片</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            預覽報告
          </button>
        </form>
      ) : (
        <div>
          <div className="link-row mb-4 print:hidden">
            <Link
              href={`/projects/${id}/report?from=${from}&to=${to}&photos=${includePhotos ? "1" : "0"}`}
            >
              ← 返回選項
            </Link>
            <PrintButton />
          </div>

          <article
            className="bg-[var(--color-surface)] p-6 border border-[var(--color-border)] rounded-[var(--radius-md)]"
            id="report"
          >
            <p className="brand-mark mb-1">{PRODUCT_NAME}</p>
            <h2 className="text-xl font-semibold mb-1">{project.name}｜進度報告</h2>
            <p className="secondary text-sm mb-4">
              客戶：{project.clientDisplayName || "—"}｜地點：{project.location || "—"}
              <br />
              工程狀態：{projectStatusLabel[project.status]}｜報告區間：
              <span className="font-mono">
                {formatDateZh(from)} – {formatDateZh(to)}
              </span>
            </p>

            <h3 className="font-semibold mb-2">工種狀態摘要</h3>
            <ul className="mb-6 space-y-2">
              {trades.map((t) => (
                <li key={t.id} className="flex flex-wrap gap-2 items-center text-sm">
                  <strong>{t.name}</strong>
                  <TradeStatusChip status={t.status} />
                  <span className="font-mono secondary">
                    {formatDateZh(t.plannedStart)} – {formatDateZh(t.plannedEnd)}
                  </span>
                  <span className="muted">{tradeStatusLabel[t.status]}</span>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold mb-2">日誌摘要</h3>
            {logs.length === 0 ? (
              <p className="secondary text-sm">此區間無日誌</p>
            ) : (
              logs.map((log) => {
                const author = data.users.find((u) => u.id === log.authorUserId);
                const trade = data.trades.find((t) => t.id === log.projectTradeId);
                const photos = includePhotos
                  ? data.photos.filter((p) => p.workLogId === log.id)
                  : [];
                return (
                  <div key={log.id} className="mb-4 pb-3 border-b border-[var(--color-border)]">
                    <p className="text-sm secondary mb-1">
                      {trade?.name} · {author?.name} ·{" "}
                      <span className="font-mono">{formatDateTimeZh(log.createdAt)}</span>
                    </p>
                    <p className="mb-2 whitespace-pre-wrap">{log.body}</p>
                    {photos.length > 0 && (
                      <div className="photo-grid">
                        {photos.map((p) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.id} src={p.url} alt="" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <p className="muted text-xs mt-6">
              由 {PRODUCT_NAME} 產生 · {formatDateTimeZh(new Date().toISOString())}
            </p>
          </article>
        </div>
      )}
    </div>
  );
}
