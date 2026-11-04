import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteTradeAction,
  renameTradeAction,
  updateTradeScheduleAction,
} from "@/actions/projects";
import { AssignLeadForm } from "@/components/AssigneeSelect";
import { CreatePartnerForm } from "@/components/CreatePartnerForm";
import { ConfirmTwiceButton } from "@/components/ConfirmTwiceButton";
import { SubmitButton } from "@/components/SubmitButton";
import { DependencyBanner } from "@/components/DependencyBanner";
import { TradeStatusControl } from "@/components/TradeStatusControl";
import { ProcurementStatusChip } from "@/components/StatusChip";
import { canManageProjects, requireSession } from "@/lib/auth";
import { formatDateZh } from "@/lib/dates";
import { evaluateDependency } from "@/lib/dependencies";
import { formatLeadLabel } from "@/lib/format";
import {
  assignableUsers,
  canAccessProject,
  canAccessTrade,
  canEditTrade,
  canLeadProject,
} from "@/lib/permissions";
import { readData } from "@/lib/store";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string; tradeId: string }>;
}) {
  const { id, tradeId } = await params;
  const user = await requireSession();
  const data = await readData();
  if (!canAccessProject(data, user, id)) notFound();
  const project = data.projects.find((p) => p.id === id);
  const trade = data.trades.find((t) => t.id === tradeId && t.projectId === id);
  if (!project || !trade) notFound();

  if (!canAccessTrade(data, user, trade)) {
    return (
      <div className="page">
        <h1 className="page-title">無權限</h1>
        <p className="mt-3">您沒有權限檢視此工種</p>
        <Link href={`/projects/${id}`} className="btn btn-secondary mt-6">
          返回工程
        </Link>
      </div>
    );
  }

  const leader = canLeadProject(data, user, id);
  const canEdit = canEditTrade(data, user, trade);
  const hint = evaluateDependency(data, trade);
  const assignee = data.users.find((u) => u.id === trade.assigneeUserId);
  const procs = data.procurements.filter((p) => p.tradeId === tradeId);
  const shortage = procs.filter((p) => p.status === "shortage").length;
  const leads = assignableUsers(data);

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href={`/projects/${id}`}>{project.name}</Link>
      </p>
      <header className="page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">{trade.name}</h1>
          <p className="secondary text-sm mt-1">
            負責人：{assignee ? formatLeadLabel(assignee) : "未指派"}
          </p>
        </div>
      </header>

      <TradeStatusControl tradeId={trade.id} status={trade.status} canEdit={canEdit} />

      <div className="mt-4">
        <DependencyBanner hint={hint} />
      </div>

      {leader && (
        <>
          <h2 className="section-title">工種名稱</h2>
          <form action={renameTradeAction} className="mb-4">
            <input type="hidden" name="tradeId" value={trade.id} />
            <div className="field">
              <label htmlFor="name">名稱（可自訂，不限預設範本）</label>
              <input id="name" name="name" required defaultValue={trade.name} />
            </div>
            <SubmitButton label="重新命名" className="btn btn-secondary" />
          </form>
        </>
      )}

      <h2 className="section-title">排程</h2>
      <div className="list" style={{ padding: "var(--space-3) var(--page-padding-x)" }}>
        <p className="mb-1">
          計劃進場：<span className="font-mono">{formatDateZh(trade.plannedStart)}</span>
        </p>
        <p className="mb-1">
          計劃完工：<span className="font-mono">{formatDateZh(trade.plannedEnd)}</span>
        </p>
        <p className="mb-1">
          實際進場：<span className="font-mono">{formatDateZh(trade.actualStart)}</span>
        </p>
        <p className="mb-0">
          實際完工：<span className="font-mono">{formatDateZh(trade.actualEnd)}</span>
        </p>
        {trade.notes && <p className="mt-2 secondary text-sm">{trade.notes}</p>}
      </div>

      {leader && (
        <>
          <h2 className="section-title">指派負責人</h2>
          {canManageProjects(user) ? (
            <p className="secondary text-sm mb-2">
              找不到公司？先到{" "}
              <Link href={`/partners?projectId=${id}`} className="btn btn-tertiary" style={{ display: "inline", padding: 0, minHeight: 0 }}>
                工程公司／負責人
              </Link>{" "}
              新增。
            </p>
          ) : (
            <>
              <h3 className="section-title">新增工程負責人</h3>
              <CreatePartnerForm className="mb-4">
                <input type="hidden" name="projectId" value={id} />
                <input type="hidden" name="tradeId" value={trade.id} />
                <div className="field">
                  <label htmlFor="leadCompany">工程公司名稱（必填）</label>
                  <input id="leadCompany" name="companyName" required />
                </div>
                <div className="field">
                  <label htmlFor="leadName">負責人姓名（必填）</label>
                  <input id="leadName" name="name" required />
                </div>
                <div className="field">
                  <label htmlFor="leadPhone">電話（E.164）</label>
                  <input
                    id="leadPhone"
                    name="phoneE164"
                    className="font-mono"
                    placeholder="+85291234567"
                  />
                </div>
                <div className="field">
                  <label htmlFor="leadEmail">登入電郵（必填）</label>
                  <input id="leadEmail" name="email" type="email" required autoComplete="off" />
                </div>
                <div className="field">
                  <label htmlFor="leadPassword">密碼（至少 6 位）</label>
                  <input
                    id="leadPassword"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <SubmitButton label="儲存" className="btn btn-primary" />
              </CreatePartnerForm>
            </>
          )}
          <AssignLeadForm
            tradeId={trade.id}
            assigneeUserId={trade.assigneeUserId}
            leads={leads.map((person) => ({
              id: person.id,
              label: formatLeadLabel(person),
            }))}
          />

          <h2 className="section-title">編輯排程</h2>
          <form action={updateTradeScheduleAction}>
            <input type="hidden" name="tradeId" value={trade.id} />
            <div className="field">
              <label htmlFor="plannedStart">計劃進場日</label>
              <input
                id="plannedStart"
                name="plannedStart"
                type="date"
                className="font-mono"
                defaultValue={trade.plannedStart}
              />
            </div>
            <div className="field">
              <label htmlFor="plannedEnd">計劃完工日</label>
              <input
                id="plannedEnd"
                name="plannedEnd"
                type="date"
                className="font-mono"
                defaultValue={trade.plannedEnd}
              />
            </div>
            <div className="field">
              <label htmlFor="notes">備註</label>
              <textarea id="notes" name="notes" defaultValue={trade.notes} />
            </div>
            <SubmitButton label="儲存排程" className="btn btn-primary" />
          </form>
        </>
      )}

      <h2 className="section-title">採購摘要</h2>
      <p className="text-sm secondary mb-2">
        共 {procs.length} 項{shortage > 0 ? `｜缺料 ${shortage}` : ""}
      </p>
      {procs.slice(0, 3).map((p) => (
        <div key={p.id} className="flex items-center gap-2 mb-2 text-sm">
          <ProcurementStatusChip status={p.status} />
          <span>{p.name}</span>
        </div>
      ))}

      <div className="link-row">
        <Link href={`/projects/${id}/trades/${tradeId}/logs`}>日誌與相片</Link>
        <Link href={`/projects/${id}/procurement`}>相關採購</Link>
      </div>

      {leader && (
        <div className="mt-8">
          <ConfirmTwiceButton
            action={deleteTradeAction}
            fields={{ tradeId: trade.id }}
            label="刪除此工種"
            first={`刪除此工種「${trade.name}」？`}
            second={`再次確認：刪除「${trade.name}」後不能復原。`}
          />
          <p className="muted text-xs mt-2">會一併移除相關依賴、日誌與留言（採購改為案級）。</p>
        </div>
      )}
    </div>
  );
}
