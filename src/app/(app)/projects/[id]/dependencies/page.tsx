import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  addDependencyAction,
  deleteDependencyAction,
} from "@/actions/projects";
import { canManageProjects, requireSession } from "@/lib/auth";
import { tradeStatusLabel } from "@/lib/labels";
import { canAccessProject } from "@/lib/permissions";
import { readData } from "@/lib/store";
import { TRADE_STATUSES } from "@/lib/types";

export default async function DependenciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  if (!canManageProjects(user)) redirect(`/projects/${id}`);
  const data = await readData();
  if (!canAccessProject(data, user, id)) notFound();
  const project = data.projects.find((p) => p.id === id);
  if (!project) notFound();
  const trades = data.trades
    .filter((t) => t.projectId === id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const deps = data.dependencies.filter((d) => d.projectId === id);

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href={`/projects/${id}`}>{project.name}</Link>
      </p>
      <h1 className="page-title mb-2">依賴設定</h1>
      <p className="secondary text-sm mb-4">僅提示，不鎖死現場操作。</p>

      <div className="list mb-6">
        {deps.length === 0 && (
          <div className="empty">尚未設定依賴</div>
        )}
        {deps.map((d) => {
          const trade = trades.find((t) => t.id === d.tradeId);
          const upstream = trades.find((t) => t.id === d.dependsOnTradeId);
          return (
            <div key={d.id} className="list-row">
              <div className="list-row-main">
                <p className="list-row-title" style={{ fontSize: "var(--text-md)" }}>
                  {trade?.name} ← 需 {upstream?.name} 達〔
                  {tradeStatusLabel[d.requiredStatus]}〕
                </p>
              </div>
              <form action={deleteDependencyAction}>
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="projectId" value={id} />
                <button type="submit" className="btn btn-tertiary">
                  刪除
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <h2 className="section-title">新增依賴</h2>
      <form action={addDependencyAction}>
        <input type="hidden" name="projectId" value={id} />
        <div className="field">
          <label htmlFor="tradeId">工種（受影響）</label>
          <select id="tradeId" name="tradeId" required>
            {trades.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="dependsOnTradeId">前置工種</label>
          <select id="dependsOnTradeId" name="dependsOnTradeId" required>
            {trades.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="requiredStatus">需達狀態</label>
          <select id="requiredStatus" name="requiredStatus" defaultValue="completed">
            {TRADE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {tradeStatusLabel[s]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          新增
        </button>
      </form>
    </div>
  );
}
