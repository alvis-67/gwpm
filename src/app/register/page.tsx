"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerOwnerAction } from "@/actions/register";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/labels";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerOwnerAction, null);

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <div className="brand-mark text-[length:var(--text-2xl)] mb-2">{PRODUCT_NAME}</div>
        <p className="secondary mb-2">註冊工程公司老闆帳號</p>
        <p className="muted text-sm mb-6">
          每間公司獨立空間：只看見自己的工程案。{PRODUCT_TAGLINE}
        </p>

        <form action={formAction}>
          <div className="field">
            <label htmlFor="orgName">工程公司名稱（必填）</label>
            <input
              id="orgName"
              name="orgName"
              required
              placeholder="例：Infunity Company Limited"
            />
          </div>
          <div className="field">
            <label htmlFor="name">老闆姓名（必填）</label>
            <input id="name" name="name" required placeholder="例：Alvis" />
          </div>
          <div className="field">
            <label htmlFor="email">電郵（必填）</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="phoneE164">電話（E.164）</label>
            <input
              id="phoneE164"
              name="phoneE164"
              className="font-mono"
              placeholder="+85291234567"
            />
          </div>
          <div className="field">
            <label htmlFor="password">密碼（必填，至少 6 位）</label>
            <input id="password" name="password" type="password" required minLength={6} />
          </div>
          {state?.error && (
            <p className="mb-3 text-sm" style={{ color: "var(--color-danger)" }}>
              {state.error}
            </p>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
            {pending ? "建立中…" : "建立公司帳號"}
          </button>
        </form>

        <p className="text-sm secondary mt-6 text-center">
          已有帳號？{" "}
          <Link href="/login" style={{ color: "var(--color-brand)", fontWeight: 500 }}>
            登入
          </Link>
        </p>
      </div>
    </main>
  );
}
