import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";
import { roleLabel } from "@/lib/labels";
import { getOrganization } from "@/lib/permissions";
import { readData } from "@/lib/store";

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
        系統管理員建立登入。公開註冊已關閉。老闆只看本公司，項目成員只看自己參與的工程。
      </p>
      <div className="list">
        {people.map((account) => {
          const org = getOrganization(data, account.orgId);
          return (
            <div key={account.id} className="list-row">
              <div className="list-row-main">
                <h2 className="list-row-title">{account.name}</h2>
                <div className="list-row-meta">
                  <span>{roleLabel[account.roleDefault]}</span>
                  <span>{account.email}</span>
                  <span>{org?.name || account.companyName || "未分公司"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
