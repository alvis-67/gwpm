"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/labels";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: "1fr",
        background: "var(--color-bg)",
      }}
      className="md:grid-cols-2"
    >
      <section
        className="relative min-h-[36vh] md:min-h-full"
        style={{
          background:
            "linear-gradient(165deg, rgba(15,92,86,0.78), rgba(28,36,41,0.72)), url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80') center/cover",
        }}
      >
        <div className="absolute inset-0 flex items-end p-6 md:p-10">
          <p className="text-white/90 text-sm md:text-base max-w-sm">
            工地現場調度：進場、進度、採購與日誌一處掌握。
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 md:p-10 bg-[var(--color-surface)]">
        <div className="w-full max-w-md">
          <div className="brand-mark text-[length:var(--text-2xl)] md:text-[length:var(--text-3xl)] mb-2">
            {PRODUCT_NAME}
          </div>
          <p className="secondary mb-8">{PRODUCT_TAGLINE}</p>

          <form action={formAction}>
            <div className="field">
              <label htmlFor="email">電郵（必填）</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                defaultValue="owner@demo.local"
              />
            </div>
            <div className="field">
              <label htmlFor="password">密碼（必填）</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue="owner123"
              />
            </div>
            {state?.error && <p className="error mb-3 text-sm" style={{ color: "var(--color-danger)" }}>{state.error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
              {pending ? "登入中…" : "登入"}
            </button>
          </form>

          <div className="mt-8 text-sm secondary">
            <p className="font-medium text-[var(--color-ink)] mb-2">演示帳號</p>
            <ul className="space-y-1 font-mono text-xs">
              <li>老闆 owner@demo.local / owner123</li>
              <li>油漆 paint@demo.local / lead123</li>
              <li>水電 plumb@demo.local / lead123</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
