import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updatePartnerAction } from "@/actions/partners";
import { SubmitButton } from "@/components/SubmitButton";
import { canManageProjects, isAdmin, requireSession } from "@/lib/auth";
import { readData } from "@/lib/store";

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!canManageProjects(session)) redirect("/me");
  const admin = isAdmin(session);
  const data = await readData();
  const lead = data.users.find(
    (u) =>
      u.id === id &&
      u.roleDefault === "trade_lead" &&
      (admin || u.orgId === session.orgId),
  );
  if (!lead) notFound();

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href="/partners">工程公司／負責人</Link>
      </p>
      <h1 className="page-title mb-4">編輯負責人</h1>
      <form action={updatePartnerAction}>
        <input type="hidden" name="userId" value={lead.id} />
        <div className="field">
          <label htmlFor="companyName">工程公司名稱（必填）</label>
          <input
            id="companyName"
            name="companyName"
            required
            defaultValue={lead.companyName}
          />
        </div>
        <div className="field">
          <label htmlFor="name">負責人姓名（必填）</label>
          <input id="name" name="name" required defaultValue={lead.name} />
        </div>
        <div className="field">
          <label htmlFor="phoneE164">電話（E.164，供 WhatsApp）</label>
          <input
            id="phoneE164"
            name="phoneE164"
            className="font-mono"
            defaultValue={lead.phoneE164}
            placeholder="+85291234567"
          />
        </div>
        <div className="field">
          <label htmlFor="email">登入電郵（必填）</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={lead.email}
          />
        </div>
        {admin && (
          <div className="field">
            <label htmlFor="password">重設密碼（留空＝不更改）</label>
            <input id="password" name="password" type="password" minLength={6} />
          </div>
        )}
        <SubmitButton label="儲存" className="btn btn-primary btn-block md:max-w-xs" />
      </form>
    </div>
  );
}
