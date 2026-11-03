import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";
import { readData } from "@/lib/store";
import { NewAccountForm } from "./form";

export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const user = await requireSession();
  if (!isAdmin(user)) redirect("/me");
  const projectId = (await searchParams).projectId || "";
  const data = await readData();
  const organizations = [...data.organizations].sort((a, b) =>
    a.name.localeCompare(b.name, "zh-Hant"),
  );

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href="/accounts">帳號</Link>
      </p>
      <h1 className="page-title mb-2">建立帳號</h1>
      <p className="secondary text-sm mb-4">
        對方用你設定的電郵與密碼登入，不能自行註冊。
      </p>
      <NewAccountForm organizations={organizations} projectId={projectId} />
    </div>
  );
}
