import Link from "next/link";
import { redirect } from "next/navigation";
import { createPartnerAction } from "@/actions/partners";
import { requireSession, isOwner } from "@/lib/auth";

export default async function NewPartnerPage() {
  const user = await requireSession();
  if (!isOwner(user)) redirect("/me");

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href="/partners">工程公司／負責人</Link>
      </p>
      <h1 className="page-title mb-4">新增工程公司負責人</h1>
      <form action={createPartnerAction}>
        <div className="field">
          <label htmlFor="companyName">工程公司名稱（必填）</label>
          <input id="companyName" name="companyName" required placeholder="例：美新油漆工程" />
        </div>
        <div className="field">
          <label htmlFor="name">負責人姓名（必填）</label>
          <input id="name" name="name" required placeholder="例：李師傅" />
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
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">初始密碼（必填，至少 6 位）</label>
          <input id="password" name="password" type="password" required minLength={6} />
        </div>
        <button type="submit" className="btn btn-primary btn-block md:max-w-xs">
          建立
        </button>
      </form>
    </div>
  );
}
