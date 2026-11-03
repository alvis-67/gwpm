import Link from "next/link";
import { canManageProjects, requireSession } from "@/lib/auth";
import { formatDateZh } from "@/lib/dates";
import { projectStatusLabel } from "@/lib/labels";
import { visibleProjects } from "@/lib/permissions";
import { readData } from "@/lib/store";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/types";
import { ProjectStatusChip } from "@/components/StatusChip";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireSession();
  const data = await readData();
  const owner = canManageProjects(user);
  const statusFilter = (sp.status || "all") as ProjectStatus | "all";

  let projects = visibleProjects(data, user).filter((p) => p.status !== "archived" || statusFilter === "archived");
  if (statusFilter !== "all" && PROJECT_STATUSES.includes(statusFilter as ProjectStatus)) {
    projects = visibleProjects(data, user).filter((p) => p.status === statusFilter);
  } else if (statusFilter === "all") {
    projects = visibleProjects(data, user).filter((p) => p.status !== "archived");
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">工程</h1>
        {owner && (
          <Link href="/projects/new" className="btn btn-primary">
            建立新工程
          </Link>
        )}
      </header>

      <div className="filter-row">
        <Link
          href="/projects"
          className="chip-filter"
          aria-pressed={statusFilter === "all"}
        >
          全部
        </Link>
        {PROJECT_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/projects?status=${s}`}
            className="chip-filter"
            aria-pressed={statusFilter === s}
          >
            {projectStatusLabel[s]}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <p>尚無工程案</p>
          {owner && (
            <Link href="/projects/new" className="btn btn-primary mt-4">
              建立新工程
            </Link>
          )}
        </div>
      ) : (
        <div className="list">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="list-row">
              <div className="list-row-main">
                <h2 className="list-row-title">{p.name}</h2>
                <div className="list-row-meta">
                  <ProjectStatusChip status={p.status} />
                  <span>{p.location || "地點未填"}</span>
                  <span className="font-mono">
                    {formatDateZh(p.plannedStart)} – {formatDateZh(p.plannedEnd)}
                  </span>
                </div>
              </div>
              <span className="muted" aria-hidden>
                ›
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
