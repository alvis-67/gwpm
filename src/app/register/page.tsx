"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/actions/register";
import { APP_VERSION_LABEL } from "@/lib/version";
import "../login/login.css";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <main className="gpms-login">
      <section className="stage" aria-hidden="true">
        <div className="stage-inner">
          <div className="rule" />
          <p>工地現場調度：進場、進度、採購與日誌一處掌握。</p>
        </div>
      </section>
      <section className="panel">
        <div className="card">
          <h1 className="wordmark">GPMS</h1>
          <p className="version">{APP_VERSION_LABEL}</p>
          {state?.ok ? (
            <p className="hint">已提交。系統管理員核准後才能登入。</p>
          ) : (
            <form action={formAction}>
              <div className="field">
                <label htmlFor="email">電郵（必填）</label>
                <input id="email" name="email" type="email" autoComplete="username" required />
              </div>
              <div className="field">
                <label htmlFor="password">密碼（至少 6 位）</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="name">姓名（必填）</label>
                <input id="name" name="name" autoComplete="name" required />
              </div>
              <div className="field">
                <label htmlFor="company">公司（必填）</label>
                <input id="company" name="company" required />
              </div>
              <div className="field">
                <label htmlFor="phone">電話（必填）</label>
                <input id="phone" name="phone" className="font-mono" autoComplete="tel" required />
              </div>
              {state?.error ? <p className="error">{state.error}</p> : null}
              <button type="submit" disabled={pending}>
                {pending ? "提交中…" : "註冊"}
              </button>
            </form>
          )}
          <Link href="/login" className="switch">
            返回登入
          </Link>
        </div>
      </section>
    </main>
  );
}
