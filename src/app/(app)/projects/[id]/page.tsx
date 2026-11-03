import Link from "next/link";
import { notFound } from "next/navigation";
import { addTradeAction, deleteProjectAction } from "@/actions/projects";
import { ConfirmTwiceButton } from "@/components/ConfirmTwiceButton";
import { DependencyBanner } from "@/components/DependencyBanner";
import { ProgressItem } from "@/components/ProgressItem";
import { TradeStatusChip, ProjectStatusChip } from "@/components/StatusChip";
import { canManageProjects, requireSession } from "@/lib/auth";
import { formatDateTimeZh, formatDateZh } from "@/lib/dates";
import { evaluateDependency, projectBlockedTrades } from "@/lib/dependencies";
import { formatLeadLabel } from "@/lib/format";
import {
  canAccessProject,
  visibleTradesForProject,
} from "@/lib/permissions";
import { customerPath, splitProjectNotes } from "@/lib/project-docs";
import { readData } from "@/lib/store";
import { tradeStatusLabel } from "@/lib/labels";
import { DEFAULT_TRADE_TEMPLATES } from "@/lib/types";

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
  const owner = canManageProjects(user);
  const docs = splitProjectNotes(project.notes);
  const trades = visibleTradesForProject(data, user, id);
  const blocked = owner ? projectBlockedTrades(data, id) : [];
  const completed = trades.filter((t) => t.status === "completed").length;
  const progress = trades.length ? Math.round((completed / trades.length) * 100) : 0;

  const recentLogs = data.workLogs
    .filter((l) => trades.some((t) => t.id === l.projectTradeId) || (owner && data.trades.some((t) => t.id === l.projectTradeId && t.projectId === id)))
    .slice(0, 5);

  // For owner show all project logs; for lead already filtered via trades
  const logs = owner
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
          <p className="brand-mark text-sm mb-2">Gwpm</p>
          <h1 className="page-title">{project.name}</h1>
          <div className="list-row-meta mt-2">
            <ProjectStatusChip status={project.status} />
            <span>工作地點：{project.location || "未填"}</span>
            {project.clientDisplayName ? (
              <Link href={customerPath(project.clientDisplayName)}>
                {project.clientDisplayName}
              </Link>
            ) : null}
            {docs.quotationNumber ? <span>報價 {docs.quotationNumber}</span> : null}
            {docs.invoiceNumber ? <span>發票 {docs.invoiceNumber}</span> : null}
          </div>
        </div>
        {owner && (
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
          return (
            <ProgressItem
              key={trade.id}
              href={`/projects/${id}/trades/${trade.id}`}
              title={trade.name}
              status={trade.status}
              assignee={assignee ? formatLeadLabel(assignee) : "未指派"}
              date={formatDateZh(trade.plannedStart)}
              blocked={hint.kind === "blocked"}
              tradeId={trade.id}
              canRemove={owner}
            />
          );
        })}
      </div>

      {owner && (
        <>
          <h2 className="section-title">新增工種</h2>
          <p className="secondary text-sm mb-3">
            可自訂任何工種名稱，不必使用預設範本。常用參考：
            {DEFAULT_TRADE_TEMPLATES.join("、")}。
          </p>
          <form action={addTradeAction} className="mb-2">
            <input type="hidden" name="projectId" value={id} />
            <div className="field">
              <label htmlFor="tradeName">工種名稱（必填）</label>
              <input
                id="tradeName"
                name="name"
                required
                placeholder="例：防水、鋁窗、空調、天花…"
                list="trade-suggestions"
              />
              <datalist id="trade-suggestions">
                {DEFAULT_TRADE_TEMPLATES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <button type="submit" className="btn btn-primary">
              新增工種
            </button>
          </form>
        </>
      )}

      <div className="link-row">
        <Link href={`/projects/${id}/schedule`}>排程</Link>
        <Link href={`/projects/${id}/procurement`}>採購</Link>
        {owner && <Link href={`/projects/${id}/dependencies`}>依賴設定</Link>}
        {owner && <Link href={`/projects/${id}/report`}>匯出報告</Link>}
        {owner && <Link href="/partners">工程公司／負責人</Link>}
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

      {!owner && (
        <p className="muted text-sm mt-4">
          您僅可檢視自己負責的工種。狀態說明：
          {Object.values(tradeStatusLabel).join("／")}
        </p>
      )}

      {owner && (
        <section className="mt-8">
          <h2 className="section-title">刪除工程</h2>
          <p className="secondary text-sm mb-3">
            只有管理員和工程公司老闆可以刪除，而且要確認兩次。
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
