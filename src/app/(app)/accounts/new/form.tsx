"use client";

import { useActionState } from "react";
import { createOrgAccountAction } from "@/actions/accounts";

export function NewAccountForm({
  organizations,
  projectId = "",
}: {
  organizations: { id: string; name: string }[];
  projectId?: string;
}) {
  const [state, formAction, pending] = useActionState(createOrgAccountAction, null);

  return (
    <form action={formAction}>
      {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
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
        <select id="role" name="role" required defaultValue="owner">
          <option value="owner">工程公司老闆</option>
          <option value="trade_lead">項目成員</option>
        </select>
        <p className="muted text-xs">
          老闆管理所屬公司的工程。項目成員只更新自己參與工程的工作內容和進度。
        </p>
      </div>
      <div className="field">
        <label htmlFor="orgId">工程公司（必填）</label>
        <select id="orgId" name="orgId" required defaultValue="">
          <option value="" disabled>
            選擇公司
          </option>
          <option value="__new__">新增工程公司</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="newOrgName">新公司名稱</label>
        <input id="newOrgName" name="newOrgName" placeholder="選「新增工程公司」時必填" />
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
        <label htmlFor="companyName">顯示公司名稱</label>
        <input id="companyName" name="companyName" placeholder="留空則用工程公司名稱" />
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
