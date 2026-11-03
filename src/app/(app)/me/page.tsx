import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { changePasswordAction, updateProfileAction } from "@/actions/profile";
import { canManageProjects, isAdmin, requireSession } from "@/lib/auth";
import { PRODUCT_FULL, PRODUCT_NAME, roleLabel } from "@/lib/labels";
import { getOrganization } from "@/lib/permissions";
import { persistenceLabel, readData } from "@/lib/store";

export default async function MePage() {
  const user = await requireSession();
  const admin = isAdmin(user);
  const manager = canManageProjects(user);
  const data = await readData();
  const org = getOrganization(data, user.orgId);
  const storeMode = persistenceLabel();

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">我的</h1>
      </header>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold"
          style={{
            background: "var(--color-brand-subtle)",
            color: "var(--color-brand)",
          }}
          aria-hidden
        >
          {user.name.slice(0, 1)}
        </div>
        <div>
          <p className="font-medium mb-0">{user.name}</p>
          <p className="secondary text-sm mb-0">{user.email}</p>
          <p className="muted text-xs mb-0">
            {roleLabel[user.roleDefault]}
            {org ? `｜${org.name}` : ""}
          </p>
        </div>
      </div>

      {(admin || manager) && (
        <>
          <h2 className="section-title">管理</h2>
          <div className="list mb-4">
            {admin && (
              <Link href="/accounts" className="list-row">
                <div className="list-row-main">
                  <h2 className="list-row-title">帳號</h2>
                  <p className="secondary text-sm mb-0">
                    建立工程公司老闆或項目成員的登入
                  </p>
                </div>
                <span className="muted">›</span>
              </Link>
            )}
            {manager && (
              <Link href="/partners" className="list-row">
                <div className="list-row-main">
                  <h2 className="list-row-title">工程公司／負責人</h2>
                  <p className="secondary text-sm mb-0">
                    查看參與工程的公司與負責人
                  </p>
                </div>
                <span className="muted">›</span>
              </Link>
            )}
          </div>
        </>
      )}

      <h2 className="section-title">個人資料</h2>
      <form action={updateProfileAction}>
        <div className="field">
          <label htmlFor="name">姓名（必填）</label>
          <input id="name" name="name" defaultValue={user.name} required />
        </div>
        <div className="field">
          <label htmlFor="phoneE164">電話（E.164，供 WhatsApp）</label>
          <input
            id="phoneE164"
            name="phoneE164"
            className="font-mono"
            defaultValue={user.phoneE164}
            placeholder="+85291234567"
          />
          <p className="muted text-xs">格式例：+85291234567（含國碼，勿省略 +）</p>
        </div>
        <button type="submit" className="btn btn-primary">
          儲存
        </button>
      </form>

      <h2 className="section-title">變更密碼</h2>
      <form action={changePasswordAction}>
        <div className="field">
          <label htmlFor="password">新密碼（至少 6 位）</label>
          <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="confirm">再輸入一次</label>
          <input id="confirm" name="confirm" type="password" required minLength={6} autoComplete="new-password" />
        </div>
        <button type="submit" className="btn btn-secondary">
          更新密碼
        </button>
      </form>

      <h2 className="section-title">PWA／加入主畫面</h2>
      <p className="secondary text-sm mb-4">
        於手機瀏覽器選單選擇「加到主畫面」即可安裝 {PRODUCT_NAME}。支援離線殼與基本快取。
      </p>

      <h2 className="section-title">系統</h2>
      <p className="text-sm secondary mb-1">{PRODUCT_FULL}</p>
      <p className="text-sm muted mb-4">資料層：{storeMode}</p>

      <form action={logoutAction}>
        <button type="submit" className="btn btn-secondary">
          登出
        </button>
      </form>
    </div>
  );
}
