import Link from "next/link";
import { redirect } from "next/navigation";
import { setAccountStatusAction } from "@/actions/accounts";
import { accountStatusOf } from "@/lib/account-status";
import { isAdmin, requireSession } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/admin-account";
import { roleLabel } from "@/lib/labels";
import { getOrganization } from "@/lib/permissions";
import { readData } from "@/lib/store";
import { SubmitButton } from "@/components/SubmitButton";
import { DeleteAccountButton } from "./delete-button";

export default async function AccountsPage() {
  const user = await requireSession();
  if (!isAdmin(user)) redirect("/me");
  const data = await readData();
  const roleRank = (role: string) => {
    if (role === "admin") return 0;
    if (role === "owner") return 1;
    return 2;
  };
  const people = [...data.users].sort((a, b) => {
    if (roleRank(a.roleDefault) !== roleRank(b.roleDefault)) {
      return roleRank(a.roleDefault) - roleRank(b.roleDefault);
    }
    return a.name.localeCompare(b.name, "zh-Hant");
  });

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">帳號</h1>
        <Link href="/accounts/new" className="btn btn-primary">
          ＋ 建立
        </Link>
      </header>
      <p className="secondary text-sm mb-4">
        新註冊要等系統管理員核准後才能登入。老闆只看本公司，項目成員只看自己參與的工程。
      </p>
      <div className="list">
        {people.map((account) => {
          const org = getOrganization(data, account.orgId);
          const locked =
            account.id === user.id || account.email.toLowerCase() === ADMIN_EMAIL;
          const status = accountStatusOf(account);
          return (
            <div key={account.id} className="list-row">
              <div className="list-row-main">
                <h2 className="list-row-title">{account.name}</h2>
                <div className="list-row-meta">
                  <span>{roleLabel[account.roleDefault]}</span>
                  {status === "pending" ? <span>待核准</span> : null}
                  {status === "rejected" ? <span>已拒絕</span> : null}
                  <span>{account.email}</span>
                  <span>{org?.name || account.companyName || "未分公司"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {locked || status === "approved" ? null : (
                  <form action={setAccountStatusAction}>
                    <input type="hidden" name="userId" value={account.id} />
                    <input type="hidden" name="accountStatus" value="approved" />
                    <SubmitButton label="核准" className="btn btn-primary" />
                  </form>
                )}
                {locked || status !== "pending" ? null : (
                  <form action={setAccountStatusAction}>
                    <input type="hidden" name="userId" value={account.id} />
                    <input type="hidden" name="accountStatus" value="rejected" />
                    <SubmitButton label="拒絕" className="btn btn-secondary" />
                  </form>
                )}
                <Link href={`/accounts/${account.id}/edit`} className="btn btn-secondary">
                  編輯
                </Link>
                {locked ? null : <DeleteAccountButton userId={account.id} name={account.name} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
