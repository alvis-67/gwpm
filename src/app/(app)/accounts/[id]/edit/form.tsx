"use client";

import { useActionState } from "react";
import { updateAccountAction } from "@/actions/accounts";

export function EditAccountForm({
  account,
  organizations,
  locked,
}: {
  account: {
    id: string;
    name: string;
    email: string;
    roleDefault: "owner" | "trade_lead" | "admin";
    companyName: string;
    phoneE164: string;
    orgId: string;
  };
  organizations: { id: string; name: string }[];
  locked: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateAccountAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={account.id} />
      <div className="field">
        <label htmlFor="name">姓名（必填）</label>
        <input id="name" name="name" required defaultValue={account.name} />
      </div>
      <div className="field">
        <label htmlFor="email">電郵（必填）</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={account.email}
          readOnly={locked}
        />
      </div>
      {locked ? (
        <p className="secondary text-sm mb-4">
          此帳號是系統管理員，不能刪除，也不能改電郵或角色。密碼請在「我的」變更。
        </p>
      ) : (
        <>
          <div className="field">
            <label htmlFor="role">角色（必填）</label>
            <select id="role" name="role" required defaultValue={account.roleDefault}>
              <option value="owner">工程公司老闆</option>
              <option value="trade_lead">項目成員</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="orgId">工程公司（必填）</label>
            <select id="orgId" name="orgId" required defaultValue={account.orgId}>
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
            <label htmlFor="password">新密碼（留空＝不更改，至少 6 位）</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </>
      )}
      <div className="field">
        <label htmlFor="companyName">顯示公司名稱</label>
        <input id="companyName" name="companyName" defaultValue={account.companyName} />
      </div>
      <div className="field">
        <label htmlFor="phoneE164">電話（E.164，供 WhatsApp）</label>
        <input
          id="phoneE164"
          name="phoneE164"
          className="font-mono"
          defaultValue={account.phoneE164}
          placeholder="+85290001111"
        />
      </div>
      {state?.error && (
        <p className="mb-3 text-sm" style={{ color: "var(--color-danger)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block md:max-w-xs" disabled={pending}>
        {pending ? "儲存中…" : "儲存"}
      </button>
    </form>
  );
}
