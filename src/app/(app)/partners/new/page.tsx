import Link from "next/link";
import { redirect } from "next/navigation";
import { createPartnerAction } from "@/actions/partners";
import { SubmitButton } from "@/components/SubmitButton";
import { canManageProjects, isAdmin, requireSession } from "@/lib/auth";

export default async function NewPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const user = await requireSession();
  const projectId = (await searchParams).projectId || "";
  if (isAdmin(user)) redirect(projectId ? `/accounts/new?projectId=${projectId}` : "/accounts/new");
  if (!canManageProjects(user)) redirect("/me");

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href="/partners">工程公司／負責人</Link>
      </p>
      <h1 className="page-title mb-4">新增工程公司／負責人</h1>
      <form action={createPartnerAction}>
        {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
        <div className="field">
          <label htmlFor="companyName">工程公司名稱（必填）</label>
          <input id="companyName" name="companyName" required />
        </div>
        <div className="field">
          <label htmlFor="name">負責人姓名（必填）</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="phoneE164">電話（E.164，供 WhatsApp）</label>
          <input
            id="phoneE164"
            name="phoneE164"
            className="font-mono"
            placeholder="+85291234567"
          />
        </div>
        <div className="field">
          <label htmlFor="email">登入電郵（必填）</label>
          <input id="email" name="email" type="email" required autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="password">密碼（必填，至少 6 位）</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <SubmitButton label="儲存" className="btn btn-primary btn-block md:max-w-xs" />
      </form>
    </div>
  );
}
