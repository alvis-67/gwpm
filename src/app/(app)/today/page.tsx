import Link from "next/link";
import { TradeStatusChip } from "@/components/StatusChip";
import { DependencyBanner } from "@/components/DependencyBanner";
import { requireSession, isOwner } from "@/lib/auth";
import { formatDateZh, todayISO, tomorrowISO } from "@/lib/dates";
import { evaluateDependency } from "@/lib/dependencies";
import { visibleProjects, visibleTradesForProject } from "@/lib/permissions";
import { readData } from "@/lib/store";
import { buildTomorrowEntryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export default async function TodayPage() {
  const user = await requireSession();
  const data = await readData();
  const owner = isOwner(user);
  const today = todayISO();
  const tomorrow = tomorrowISO();

  const projects = visibleProjects(data, user);
  const myTrades = projects.flatMap((p) =>
    visibleTradesForProject(data, user, p.id).map((t) => ({ project: p, trade: t })),
  );

  const todayItems = myTrades.filter(
    (x) =>
      x.trade.plannedStart === today ||
      x.trade.status === "in_progress" ||
      x.trade.status === "ready",
  );

  const tomorrowEntries = owner
    ? data.trades
        .filter((t) => t.plannedStart === tomorrow)
        .map((trade) => {
          const project = data.projects.find((p) => p.id === trade.projectId)!;
          const assignee = data.users.find((u) => u.id === trade.assigneeUserId);
          const hint = evaluateDependency(data, trade);
          const message = buildTomorrowEntryMessage({
            projectName: project.name,
            tradeName: trade.name,
            date: tomorrow,
            location: project.location,
          });
          const wa = assignee?.phoneE164
            ? buildWhatsAppUrl(assignee.phoneE164, message)
            : null;
          return { trade, project, assignee, hint, wa };
        })
    : [];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">今日</h1>
          <p className="secondary text-sm font-mono mt-1">{formatDateZh(today)}</p>
        </div>
      </header>

      <h2 className="section-title" style={{ marginTop: 0 }}>
        {owner ? "協調待辦／進行中" : "我的工種待辦"}
      </h2>
      <div className="list">
        {todayItems.length === 0 && <div className="empty">今日無待辦工種</div>}
        {todayItems.map(({ project, trade }) => {
          const hint = evaluateDependency(data, trade);
          return (
            <Link
              key={trade.id}
              href={`/projects/${project.id}/trades/${trade.id}`}
              className="list-row"
              style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}
            >
              <div className="flex justify-between gap-2 w-full">
                <div>
                  <h3 className="list-row-title">{trade.name}</h3>
                  <p className="secondary text-sm mb-0">{project.name}</p>
                </div>
                <TradeStatusChip status={trade.status} />
              </div>
              <DependencyBanner hint={hint} />
            </Link>
          );
        })}
      </div>

      {owner && (
        <>
          <h2 className="section-title">明日進場提醒</h2>
          <p className="secondary text-sm mb-3 font-mono">進場日：{tomorrow}</p>
          <div className="list">
            {tomorrowEntries.length === 0 && (
              <div className="empty">明日無計劃進場工種</div>
            )}
            {tomorrowEntries.map(({ trade, project, assignee, hint, wa }) => (
              <div
                key={trade.id}
                className="list-row"
                style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="list-row-title">{trade.name}</h3>
                    <p className="secondary text-sm mb-0">
                      {project.name}｜{assignee?.name || "未指派"}｜
                      <span className="font-mono">{assignee?.phoneE164 || "缺電話"}</span>
                    </p>
                  </div>
                  <TradeStatusChip status={trade.status} />
                </div>
                <DependencyBanner hint={hint} />
                {wa ? (
                  <a
                    className="btn btn-whatsapp"
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp 提醒
                  </a>
                ) : (
                  <button type="button" className="btn btn-whatsapp" disabled>
                    WhatsApp 提醒（請補電話）
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
