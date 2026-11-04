"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accountStatusOf, encodeAccountPassword } from "@/lib/account-status";
import { createSession, destroySession, requireSession } from "@/lib/auth";
import { updateData } from "@/lib/store";

export async function updateProfileAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") || "").trim();
  const phoneE164 = String(formData.get("phoneE164") || "").trim();
  if (!name) throw new Error("姓名（必填）");

  await updateData(async (data) => {
    const user = data.users.find((u) => u.id === session.id);
    if (!user) throw new Error("找不到使用者");
    user.name = name;
    user.phoneE164 = phoneE164;
    await createSession(user);
  });

  revalidatePath("/me");
  revalidatePath("/today");
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireSession();
  const next = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (next.length < 6) throw new Error("密碼至少 6 位");
  if (next !== confirm) throw new Error("兩次密碼不相同");

  await updateData(async (data) => {
    const user = data.users.find((item) => item.id === session.id);
    if (!user) throw new Error("找不到使用者");
    const status = accountStatusOf(user);
    user.accountStatus = status;
    user.passwordHash = encodeAccountPassword(await hash(next, 10), status);
  });

  revalidatePath("/me");
  await destroySession();
  redirect("/login");
}
