import { redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";

export default async function NewPartnerPage() {
  const user = await requireSession();
  if (!isAdmin(user)) redirect("/me");
  redirect("/accounts/new");
}
