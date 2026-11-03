import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession, isOwner } from "@/lib/auth";
import { NewAccountForm } from "./form";

export default async function NewAccountPage() {
  const user = await requireSession();
  if (!isOwner(user)) redirect("/me");

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href="/accounts">帳號</Link>
      </p>
      <h1 className="page-title mb-2">建立帳號</h1>
      <p className="secondary text-sm mb-4">
        只加入本公司。對方用你設定的電郵與密碼登入，不能自行註冊。
      </p>
      <NewAccountForm />
    </div>
  );
}
