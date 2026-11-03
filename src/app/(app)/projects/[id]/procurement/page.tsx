import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createProcurementAction,
  updateProcurementStatusAction,
} from "@/actions/procurement";
import { ProcurementStatusChip } from "@/components/StatusChip";
import { SubmitButton } from "@/components/SubmitButton";
import { requireSession } from "@/lib/auth";
import { procurementStatusLabel } from "@/lib/labels";
import {
  canAccessProject,
  canLeadProject,
  canReportProcurement,
  visibleTradesForProject,
} from "@/lib/permissions";
import { readData } from "@/lib/store";
import { PROCUREMENT_STATUSES } from "@/lib/types";

export default async function ProcurementPage({
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
  const trades = visibleTradesForProject(data, user, id);
  const tradeIds = new Set(trades.map((t) => t.id));

  const items = data.procurements.filter((p) => {
    if (p.projectId !== id) return false;
    if (leader) return true;
    return p.tradeId && tradeIds.has(p.tradeId);
  });

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href={`/projects/${id}`}>{project.name}</Link>
      </p>
      <h1 className="page-title mb-4">採購</h1>

      <div className="list mb-6">
        {items.length === 0 && <div className="empty">尚無採購項目</div>}
        {items.map((item) => {
          const trade = data.trades.find((t) => t.id === item.tradeId);
          const canReport = leader || canReportProcurement(data, user, item.tradeId);
          return (
            <div key={item.id} className="list-row" style={{ alignItems: "flex-start" }}>
              <div className="list-row-main">
                <h3 className="list-row-title">{item.name}</h3>
                <div className="list-row-meta">
                  <ProcurementStatusChip status={item.status} />
                  <span className="font-mono">
                    {item.qty} {item.unit}
                  </span>
                  <span>{trade?.name || "案級"}</span>
                </div>
                {item.supplierNote && (
                  <p className="secondary text-sm mt-1 mb-0">{item.supplierNote}</p>
                )}
                {canReport && (
                  <form action={updateProcurementStatusAction} className="mt-3 flex gap-2 flex-wrap">
                    <input type="hidden" name="id" value={item.id} />
                    <select
                      name="status"
                      defaultValue={item.status}
                      className="min-h-11 px-2 border border-[var(--color-border)] rounded-[var(--radius-sm)]"
                    >
                      {(leader
                        ? PROCUREMENT_STATUSES
                        : (["received", "shortage"] as const)
                      ).map((s) => (
                        <option key={s} value={s}>
                          {procurementStatusLabel[s]}
                        </option>
                      ))}
                    </select>
                    <SubmitButton label="更新狀態" className="btn btn-secondary" />
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {leader && (
        <>
          <h2 className="section-title">新增採購</h2>
          <form action={createProcurementAction}>
            <input type="hidden" name="projectId" value={id} />
            <div className="field">
              <label htmlFor="name">項目名稱（必填）</label>
              <input id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="tradeId">掛鈎工種</label>
              <select id="tradeId" name="tradeId" defaultValue="">
                <option value="">案級（不掛鈎）</option>
                {data.trades
                  .filter((t) => t.projectId === id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="qty">數量</label>
              <input id="qty" name="qty" type="number" min={0} step="0.1" defaultValue={1} className="font-mono" />
            </div>
            <div className="field">
              <label htmlFor="unit">單位</label>
              <input id="unit" name="unit" defaultValue="件" />
            </div>
            <div className="field">
              <label htmlFor="supplierNote">供應商備註</label>
              <input id="supplierNote" name="supplierNote" />
            </div>
            <div className="field">
              <label htmlFor="status">狀態</label>
              <select id="status" name="status" defaultValue="todo">
                {PROCUREMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {procurementStatusLabel[s]}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton label="新增" className="btn btn-primary" />
          </form>
        </>
      )}
    </div>
  );
}
