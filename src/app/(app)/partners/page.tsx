import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageProjects, isAdmin, requireSession } from "@/lib/auth";
import { formatLeadLabel } from "@/lib/format";
import { readData } from "@/lib/store";

export default async function PartnersPage() {
  const user = await requireSession();
  if (!canManageProjects(user)) redirect("/me");
  const admin = isAdmin(user);
  const data = await readData();
  const leads = data.users
    .filter((u) => u.roleDefault === "trade_lead" && (admin || u.orgId === user.orgId))
    .sort((a, b) =>
      (a.companyName || a.name).localeCompare(b.companyName || b.name, "zh-Hant"),
    );

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">工程公司／負責人</h1>
        {admin ? (
          <Link href="/accounts/new" className="btn btn-primary">
            ＋ 建立帳號
          </Link>
        ) : (
          <Link href="/partners/new" className="btn btn-primary">
            ＋ 新增
          </Link>
        )}
      </header>
      <p className="secondary text-sm mb-4">
        管理分包工程公司及其現場負責人；之後可於工種詳情指派。
      </p>

      <div className="list">
        {leads.length === 0 && <div className="empty">尚未新增工程公司負責人</div>}
        {leads.map((lead) => {
          const assigned = data.trades.filter((t) => t.assigneeUserId === lead.id).length;
          return (
            <Link key={lead.id} href={`/partners/${lead.id}/edit`} className="list-row">
              <div className="list-row-main">
                <h2 className="list-row-title">{formatLeadLabel(lead)}</h2>
                <div className="list-row-meta">
                  <span className="font-mono">{lead.phoneE164 || "缺電話"}</span>
                  <span>{lead.email}</span>
                  <span>已指派 {assigned} 工種</span>
                </div>
              </div>
              <span className="muted">›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
