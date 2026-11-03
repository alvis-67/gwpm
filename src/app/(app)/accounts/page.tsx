import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession, isOwner } from "@/lib/auth";
import { readData } from "@/lib/store";

const ROLE_LABEL = {
  owner: "老闆（總協調）",
  trade_lead: "工種負責人",
} as const;

export default async function AccountsPage() {
  const user = await requireSession();
  if (!isOwner(user)) redirect("/me");
  const data = await readData();
  const people = data.users
    .filter((account) => account.orgId === user.orgId)
    .sort((a, b) => {
      if (a.roleDefault !== b.roleDefault) return a.roleDefault === "owner" ? -1 : 1;
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
        由老闆建立登入。帳號只屬於本公司，公開註冊已關閉。
      </p>
      <div className="list">
        {people.map((account) => (
          <div key={account.id} className="list-row">
            <div className="list-row-main">
              <h2 className="list-row-title">{account.name}</h2>
              <div className="list-row-meta">
                <span>{ROLE_LABEL[account.roleDefault]}</span>
                <span>{account.email}</span>
                {account.companyName ? <span>{account.companyName}</span> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
