import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addProjectCommentAction,
  addTradeAction,
  deleteProjectAction,
  saveCustomerPaymentAction,
  saveTradeAmountAction,
} from "@/actions/projects";
import { ConfirmTwiceButton } from "@/components/ConfirmTwiceButton";
import { DependencyBanner } from "@/components/DependencyBanner";
import { ProgressItem } from "@/components/ProgressItem";
import { SubmitButton } from "@/components/SubmitButton";
import { TradeNameField } from "@/components/TradeNameField";
import { TradeStatusChip, ProjectStatusChip } from "@/components/StatusChip";
import { canManageProjects, requireSession } from "@/lib/auth";
import { formatDateTimeZh, formatDateZh } from "@/lib/dates";
import { evaluateDependency, projectBlockedTrades } from "@/lib/dependencies";
import { formatLeadLabel } from "@/lib/format";
import {
  canAccessProject,
  canLeadProject,
  visibleProjects,
  visibleTradesForProject,
} from "@/lib/permissions";
import { tradeNameOptions } from "@/lib/trade-names";
import { formatAmount, splitTradeNotes, summarizeTradeAmounts } from "@/lib/money";
import { customerPath, splitProjectNotes } from "@/lib/project-docs";
import { readData } from "@/lib/store";
import { tradeStatusLabel } from "@/lib/labels";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const data = await readData();
  if (!canAccessProject(data, user, id)) notFound();
  const project = data.projects.find((p) => p.id === id);
  if (!project) notFound();
  const leader = canLeadProject(data, user, id);
  const manager = canManageProjects(user);
  const visibleIds = new Set(visibleProjects(data, user).map((item) => item.id));
  const tradeOptions = tradeNameOptions(
    data.trades.filter((trade) => visibleIds.has(trade.projectId)).map((trade) => trade.name),
  );
  const docs = splitProjectNotes(project.notes);
  const trades = visibleTradesForProject(data, user, id);
  const money = leader
    ? summarizeTradeAmounts(
        data.trades.filter((trade) => trade.projectId === id).map((trade) => trade.notes),
      )
    : null;
  const tradeTotal = money?.tradeTotal ?? null;
  const remainder = money ? money.remainder(docs.customerPayment) : null;
  const blocked = leader ? projectBlockedTrades(data, id) : [];
  const completed = trades.filter((t) => t.status === "completed").length;
  const progress = trades.length ? Math.round((completed / trades.length) * 100) : 0;

  const recentLogs = data.workLogs
    .filter((l) => trades.some((t) => t.id === l.projectTradeId) || (leader && data.trades.some((t) => t.id === l.projectTradeId && t.projectId === id)))
    .slice(0, 5);

  const logs = leader
    ? data.workLogs
        .filter((l) =>
          data.trades.some((t) => t.id === l.projectTradeId && t.projectId === id),
        )
        .slice(0, 5)
    : recentLogs;

  return (
    <div className="page">
      <header className="page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <p className="brand-mark text-sm mb-2">GPMS</p>
          <h1 className="page-title">{project.name}</h1>
          <div className="list-row-meta mt-2">
            <ProjectStatusChip status={project.status} />
            <span>工作地點：{project.location || "未填"}</span>
            {leader && project.clientDisplayName ? (
              <Link href={customerPath(project.clientDisplayName)}>
                {project.clientDisplayName}
              </Link>
            ) : null}
            {leader && docs.quotationNumber ? <span>報價 {docs.quotationNumber}</span> : null}
            {leader && docs.invoiceNumber ? <span>發票 {docs.invoiceNumber}</span> : null}
          </div>
        </div>
        {leader && (
          <Link href={`/projects/${id}/edit`} className="btn btn-secondary">
            編輯
          </Link>
        )}
      </header>

      {blocked.length > 0 && (
        <section>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            依賴受阻（{blocked.length}）
          </h2>
          <div className="list">
            {blocked.map(({ trade, hint }) => (
              <Link
                key={trade.id}
                href={`/projects/${id}/trades/${trade.id}`}
                className="list-row"
                style={{ flexDirection: "column", alignItems: "stretch" }}
              >
                <div className="flex justify-between gap-2">
                  <strong>{trade.name}</strong>
                  <TradeStatusChip status={trade.status} />
                </div>
                <DependencyBanner hint={hint} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {leader && (
        <section className="money-strip" aria-label="客人付款">
          <form action={saveCustomerPaymentAction} className="money-strip-form">
            <input type="hidden" name="projectId" value={id} />
            <label htmlFor="customerPayment">客人付款</label>
            <input
              id="customerPayment"
              name="customerPayment"
              inputMode="decimal"
              className="money-strip-input font-mono"
              defaultValue={docs.customerPayment ?? ""}
            />
            <SubmitButton label="儲存" className="btn btn-secondary" />
          </form>
          <dl className="money-strip-figures">
            <div>
              <dt>客人付款</dt>
              <dd className="font-mono">{formatAmount(docs.customerPayment)}</dd>
            </div>
            <div>
              <dt>金額合計</dt>
              <dd className="font-mono">{formatAmount(tradeTotal)}</dd>
            </div>
            <div>
              <dt>餘額</dt>
              <dd className={`font-mono${remainder != null && remainder < 0 ? " is-negative" : ""}`}>
                {formatAmount(remainder)}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <h2 className="section-title">工程進度</h2>
      <p className="secondary text-sm mb-2">
        完成 {completed}/{trades.length}（{progress}%）
      </p>
      <div className="progress-bar mb-3">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="list">
        {trades.map((trade) => {
          const assignee = data.users.find((u) => u.id === trade.assigneeUserId);
          const hint = evaluateDependency(data, trade);
          const amount = leader ? splitTradeNotes(trade.notes).amount : null;
          return (
            <div key={trade.id}>
              <ProgressItem
                href={`/projects/${id}/trades/${trade.id}`}
                title={trade.name}
                status={trade.status}
                assignee={assignee ? formatLeadLabel(assignee) : "未指派"}
                date={formatDateZh(trade.plannedStart)}
                blocked={hint.kind === "blocked"}
                tradeId={trade.id}
                canRemove={leader}
              />
              {leader && (
                <form action={saveTradeAmountAction} className="trade-amount-form">
                  <input type="hidden" name="tradeId" value={trade.id} />
                  <label htmlFor={`amount-${trade.id}`}>金額</label>
                  <input
                    id={`amount-${trade.id}`}
                    name="amount"
                    inputMode="decimal"
                    className="trade-amount-input font-mono"
                    defaultValue={amount ?? ""}
                  />
                  <SubmitButton label="儲存" className="btn btn-secondary" />
                </form>
              )}
            </div>
          );
        })}
      </div>

      {leader && (
        <>
          <h2 className="section-title">新增工種</h2>
          <p className="secondary text-sm mb-3">
            選預設工種，或選「新增」輸入名稱。輸入過的名稱下次會出現在選單。
          </p>
          <form action={addTradeAction} className="mb-2">
            <input type="hidden" name="projectId" value={id} />
            <TradeNameField options={tradeOptions} />
            <SubmitButton label="新增工種" className="btn btn-primary" />
          </form>
        </>
      )}

      {leader && (
        <>
          <h2 className="section-title">留言</h2>
          {docs.comments.length === 0 ? (
            <p className="empty">尚無留言</p>
          ) : (
            <div className="mb-4">
              {docs.comments.map((comment) => {
                const author = data.users.find((item) => item.id === comment.authorUserId);
                return (
                  <div key={comment.id} className="timeline-item">
                    <div className="flex justify-between gap-2 text-sm secondary">
                      <strong style={{ color: "var(--color-ink)" }}>{author?.name || "負責人"}</strong>
                      <span className="font-mono">{formatDateTimeZh(comment.createdAt)}</span>
                    </div>
                    <p className="mt-2 mb-0 whitespace-pre-wrap">{comment.body}</p>
                  </div>
                );
              })}
            </div>
          )}
          <form action={addProjectCommentAction} className="mb-6">
            <input type="hidden" name="projectId" value={id} />
            <div className="field">
              <label htmlFor="commentBody">留言（必填）</label>
              <textarea id="commentBody" name="body" required placeholder="輸入留言…" />
            </div>
            <SubmitButton label="送出" className="btn btn-primary" />
          </form>
        </>
      )}

      <div className="link-row">
        <Link href={`/projects/${id}/schedule`}>排程</Link>
        <Link href={`/projects/${id}/procurement`}>採購</Link>
        {leader && <Link href={`/projects/${id}/dependencies`}>依賴設定</Link>}
        {leader && <Link href={`/projects/${id}/report`}>匯出報告</Link>}
        {manager && <Link href="/partners">工程公司／負責人</Link>}
      </div>

      <h2 className="section-title">近期動態</h2>
      {logs.length === 0 ? (
        <p className="empty">尚無日誌動態</p>
      ) : (
        <div className="list" style={{ padding: "0 var(--page-padding-x)" }}>
          {logs.map((log) => {
            const author = data.users.find((u) => u.id === log.authorUserId);
            const trade = data.trades.find((t) => t.id === log.projectTradeId);
            return (
              <div key={log.id} className="timeline-item">
                <div className="flex justify-between gap-2 text-sm secondary">
                  <span>
                    {author?.name} · {trade?.name}
                  </span>
                  <span className="font-mono">{formatDateTimeZh(log.createdAt)}</span>
                </div>
                <p className="mt-1 mb-0">{log.body}</p>
              </div>
            );
          })}
        </div>
      )}

      {!leader && (
        <p className="muted text-sm mt-4">
          您僅可檢視自己負責的工種。狀態說明：
          {Object.values(tradeStatusLabel).join("／")}
        </p>
      )}

      {leader && (
        <section className="mt-8">
          <h2 className="section-title">刪除工程</h2>
          <p className="secondary text-sm mb-3">
            只有此工程的 Leader 和管理員可以刪除，而且要確認兩次。
          </p>
          <ConfirmTwiceButton
            action={deleteProjectAction}
            fields={{ projectId: id }}
            label="刪除工程"
            first={`刪除工程「${project.name}」？`}
            second="再次確認：刪除後不能復原。確定刪除？"
          />
        </section>
      )}
    </div>
  );
}
