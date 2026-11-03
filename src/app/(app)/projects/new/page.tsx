import { redirect } from "next/navigation";
import { createProjectAction } from "@/actions/projects";
import { canManageProjects, isAdmin, requireSession } from "@/lib/auth";
import { readData } from "@/lib/store";

export default async function NewProjectPage() {
  const user = await requireSession();
  if (!canManageProjects(user)) redirect("/projects");
  const admin = isAdmin(user);
  const data = admin ? await readData() : null;

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">建立工程案</h1>
      </header>
      <form action={createProjectAction}>
        {admin && data && (
          <div className="field">
            <label htmlFor="orgId">工程公司（必填）</label>
            <select id="orgId" name="orgId" required defaultValue="">
              <option value="" disabled>
                選擇承接此工程的公司
              </option>
              {data.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="name">工程案名稱（必填）</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="location">工作地點</label>
          <input id="location" name="location" />
        </div>
        <div className="field">
          <label htmlFor="clientDisplayName">客戶顯示名稱</label>
          <input id="clientDisplayName" name="clientDisplayName" />
        </div>
        <div className="field">
          <label htmlFor="quotationNumber">報價編號</label>
          <input id="quotationNumber" name="quotationNumber" />
        </div>
        <div className="field">
          <label htmlFor="invoiceNumber">發票編號</label>
          <input id="invoiceNumber" name="invoiceNumber" />
        </div>
        <div className="field">
          <label htmlFor="plannedStart">計劃開始</label>
          <input id="plannedStart" name="plannedStart" type="date" className="font-mono" />
        </div>
        <div className="field">
          <label htmlFor="plannedEnd">計劃完工</label>
          <input id="plannedEnd" name="plannedEnd" type="date" className="font-mono" />
        </div>
        <div className="field">
          <label htmlFor="notes">備註</label>
          <textarea id="notes" name="notes" />
        </div>
        <label className="flex items-center gap-2 mb-2 text-sm">
          <input type="checkbox" name="withTemplates" />
          套用預設工種範本（清拆、水電、泥水…）
        </label>
        <p className="muted text-xs mb-6">
          可不勾選；之後於工程案內自行新增任意工種名稱。
        </p>
        <button type="submit" className="btn btn-primary btn-block md:max-w-xs">
          建立
        </button>
      </form>
    </div>
  );
}
