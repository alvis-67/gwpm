import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/labels";
import { APP_VERSION_LABEL } from "@/lib/version";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/projects");

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <div className="brand-mark text-[length:var(--text-2xl)] mb-2">{PRODUCT_NAME}</div>
        <p className="font-medium mb-2">{APP_VERSION_LABEL}</p>
        <p className="secondary mb-6">{PRODUCT_TAGLINE}</p>
        <Link href="/login" className="btn btn-primary btn-block">
          登入
        </Link>
        <Link href="/register" className="btn btn-secondary btn-block mt-3">
          註冊
        </Link>
        <p className="secondary text-sm mt-6 mb-0">
          沒有帳號可以註冊，經系統管理員核准後才能登入。登入只認本系統帳號，不認在 Supabase Authentication 建立的用戶。
        </p>
      </div>
    </main>
  );
}
