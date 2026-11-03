import Link from "next/link";
import { notFound } from "next/navigation";
import { DependencyBanner } from "@/components/DependencyBanner";
import { TradeStatusChip, ProjectStatusChip } from "@/components/StatusChip";
import { requireSession, isOwner } from "@/lib/auth";
import { formatDateTimeZh, formatDateZh } from "@/lib/dates";
import { evaluateDependency, projectBlockedTrades } from "@/lib/dependencies";
import {
  canAccessProject,
  visibleTradesForProject,
} from "@/lib/permissions";
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
  const owner = isOwner(user);
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
            <span>{project.location || "地點未填"}</span>
          </div>
        </div>
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

      <h2 className="section-title">工種進度</h2>
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
            <Link
              key={trade.id}
              href={`/projects/${id}/trades/${trade.id}`}
              className="list-row"
            >
              <div className="list-row-main">
                <h3 className="list-row-title">{trade.name}</h3>
                <div className="list-row-meta">
                  <TradeStatusChip status={trade.status} />
                  <span>{assignee?.name || "未指派"}</span>
                  <span className="font-mono">{formatDateZh(trade.plannedStart)}</span>
                  {hint.kind === "blocked" && <span style={{ color: "var(--color-danger)" }}>受阻</span>}
                </div>
              </div>
              <span className="muted">›</span>
            </Link>
          );
        })}
      </div>

      <div className="link-row">
        <Link href={`/projects/${id}/schedule`}>排程</Link>
        <Link href={`/projects/${id}/procurement`}>採購</Link>
        {owner && <Link href={`/projects/${id}/dependencies`}>依賴設定</Link>}
        {owner && <Link href={`/projects/${id}/report`}>匯出報告</Link>}
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
    </div>
  );
}
