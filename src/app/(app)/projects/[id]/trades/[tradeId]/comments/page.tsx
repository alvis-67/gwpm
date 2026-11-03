import Link from "next/link";
import { notFound } from "next/navigation";
import { addCommentAction } from "@/actions/trades";
import { SubmitButton } from "@/components/SubmitButton";
import { requireSession } from "@/lib/auth";
import { formatDateTimeZh } from "@/lib/dates";
import { canAccessTrade, canEditTrade } from "@/lib/permissions";
import { readData } from "@/lib/store";

export default async function TradeCommentsPage({
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
      </div>
    );
  }

  const comments = data.comments
    .filter((c) => c.projectTradeId === tradeId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href={`/projects/${id}/trades/${tradeId}`}>{trade.name}</Link>
      </p>
      <h1 className="page-title mb-4">工種留言</h1>

      <div className="mb-6">
        {comments.length === 0 && <div className="empty">尚無留言</div>}
        {comments.map((c) => {
          const author = data.users.find((u) => u.id === c.authorUserId);
          return (
            <div key={c.id} className="timeline-item">
              <div className="flex justify-between gap-2 text-sm secondary">
                <strong style={{ color: "var(--color-ink)" }}>{author?.name}</strong>
                <span className="font-mono">{formatDateTimeZh(c.createdAt)}</span>
              </div>
              <p className="mt-2 mb-0 whitespace-pre-wrap">{c.body}</p>
            </div>
          );
        })}
      </div>

      {canEditTrade(data, user, trade) ? (
        <form action={addCommentAction} className="sticky bottom-20 md:bottom-4 bg-[var(--color-bg)] pt-2">
          <input type="hidden" name="tradeId" value={tradeId} />
          <div className="field">
            <label htmlFor="body">留言（必填）</label>
            <textarea id="body" name="body" required placeholder="輸入留言…" />
          </div>
          <SubmitButton label="送出" className="btn btn-primary btn-block md:max-w-xs" />
        </form>
      ) : null}
    </div>
  );
}
