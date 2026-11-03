"use client";

import { useActionState } from "react";
import { createOrgAccountAction } from "@/actions/accounts";

export function NewAccountForm() {
  const [state, formAction, pending] = useActionState(createOrgAccountAction, null);

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="name">姓名（必填）</label>
        <input id="name" name="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">電郵（必填）</label>
        <input id="email" name="email" type="email" required autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="role">角色（必填）</label>
        <select id="role" name="role" required defaultValue="trade_lead">
          <option value="trade_lead">工種負責人</option>
          <option value="owner">老闆（總協調）</option>
        </select>
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
      <div className="field">
        <label htmlFor="companyName">公司名稱</label>
        <input id="companyName" name="companyName" placeholder="分包公司；老闆可留空" />
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
      {state?.error && (
        <p className="mb-3 text-sm" style={{ color: "var(--color-danger)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block md:max-w-xs" disabled={pending}>
        {pending ? "建立中…" : "建立帳號"}
      </button>
    </form>
  );
}
