"use server";

import { redirect } from "next/navigation";
import { destroySession, loginWithPassword } from "@/lib/auth";

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "請輸入電郵與密碼（必填）" };
  const result = await loginWithPassword(email, password);
  if (!result.ok) return { error: result.error };
  redirect("/projects");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
