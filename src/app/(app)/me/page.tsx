import { logoutAction } from "@/actions/auth";
import { updateProfileAction } from "@/actions/profile";
import { requireSession, isOwner } from "@/lib/auth";
import { PRODUCT_FULL, PRODUCT_NAME } from "@/lib/labels";
import { isUsingBlobStore } from "@/lib/store";

export default async function MePage() {
  const user = await requireSession();
  const storeMode = isUsingBlobStore() ? "Vercel Blob（可寫）" : "本地 JSON（開發）";

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
            {isOwner(user) ? "老闆（總協調）" : "工種負責人"}
          </p>
        </div>
      </div>

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
