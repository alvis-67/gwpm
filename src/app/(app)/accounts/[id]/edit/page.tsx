import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/admin-account";
import { readData } from "@/lib/store";
import { EditAccountForm } from "./form";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!isAdmin(session)) redirect("/me");
  const data = await readData();
  const account = data.users.find((user) => user.id === id);
  if (!account) notFound();
  const locked = account.id === session.id || account.email.toLowerCase() === ADMIN_EMAIL;
  const organizations = [...data.organizations].sort((a, b) =>
    a.name.localeCompare(b.name, "zh-Hant"),
  );

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href="/accounts">帳號</Link>
      </p>
      <h1 className="page-title mb-4">編輯帳號</h1>
      <EditAccountForm
        account={{
          id: account.id,
          name: account.name,
          email: account.email,
          roleDefault: account.roleDefault,
          companyName: account.companyName,
          phoneE164: account.phoneE164,
          orgId: account.orgId,
        }}
        organizations={organizations}
        locked={locked}
      />
    </div>
  );
}
