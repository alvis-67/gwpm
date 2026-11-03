import Link from "next/link";
import { notFound } from "next/navigation";
import { TradeStatusChip } from "@/components/StatusChip";
import { requireSession } from "@/lib/auth";
import { formatDateZh, todayISO, tomorrowISO } from "@/lib/dates";
import { evaluateDependency } from "@/lib/dependencies";
import { canAccessProject, canLeadProject, visibleTradesForProject } from "@/lib/permissions";
import { readData } from "@/lib/store";

function groupLabel(date: string): string {
  if (!date) return "未排程";
  if (date === todayISO()) return "今日";
  if (date === tomorrowISO()) return "明日";
  return date;
}

export default async function SchedulePage({
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

  const trades = visibleTradesForProject(data, user, id).slice().sort((a, b) =>
    (a.plannedStart || "9999").localeCompare(b.plannedStart || "9999"),
  );

  const groups = new Map<string, typeof trades>();
  for (const t of trades) {
    const key = t.plannedStart || "";
    const label = groupLabel(key);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(t);
  }

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href={`/projects/${id}`}>{project.name}</Link>
      </p>
      <header className="page-header">
        <h1 className="page-title">排程</h1>
        {canLeadProject(data, user, id) && (
          <Link href={`/projects/${id}/dependencies`} className="btn btn-tertiary">
            依賴設定
          </Link>
        )}
      </header>

      {[...groups.entries()].map(([label, items]) => (
        <section key={label}>
          <h2 className="section-title">{label}</h2>
          <div className="list">
            {items.map((trade) => {
              const hint = evaluateDependency(data, trade);
              const assignee = data.users.find((u) => u.id === trade.assigneeUserId);
              return (
                <Link
                  key={trade.id}
                  href={`/projects/${id}/trades/${trade.id}`}
                  className="list-row"
                >
                  <div className="list-row-main">
                    <h3 className="list-row-title">
                      {trade.name}
                      {hint.kind === "blocked" && (
                        <span className="ml-2 text-sm" style={{ color: "var(--color-danger)" }}>
                          ⚠ 依賴警告
                        </span>
                      )}
                    </h3>
                    <div className="list-row-meta">
                      <TradeStatusChip status={trade.status} />
                      <span>{assignee?.name || "未指派"}</span>
                      <span className="font-mono">{formatDateZh(trade.plannedStart)}</span>
                    </div>
                  </div>
                  <span className="muted">›</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
