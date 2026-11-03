"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { APP_VERSION_LABEL } from "@/lib/version";
import "./login.css";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

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
          <form action={formAction}>
            <div className="field">
              <label htmlFor="email">電郵（必填）</label>
              <input id="email" name="email" type="email" autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="password">密碼（必填）</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state?.error ? <p className="error">{state.error}</p> : null}
            <button type="submit" disabled={pending}>
              {pending ? "登入中…" : "登入"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
