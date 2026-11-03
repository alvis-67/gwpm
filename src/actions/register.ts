"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { updateData } from "@/lib/store";

export async function registerOwnerAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const orgName = String(formData.get("orgName") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phoneE164 = String(formData.get("phoneE164") || "").trim();
  const password = String(formData.get("password") || "");

  if (!orgName) return { error: "工程公司名稱（必填）" };
  if (!name) return { error: "老闆姓名（必填）" };
  if (!email) return { error: "電郵（必填）" };
  if (password.length < 6) return { error: "密碼至少 6 位" };

  let createdUserId = "";

  try {
    await updateData(async (data) => {
      if (data.users.some((u) => u.email.toLowerCase() === email)) {
        throw new Error("此電郵已被註冊");
      }
      const orgId = createId("org");
      const userId = createId("user");
      const now = new Date().toISOString();
      data.organizations.push({
        id: orgId,
        name: orgName,
        createdAt: now,
      });
      const passwordHash = await hash(password, 10);
      data.users.push({
        id: userId,
        orgId,
        email,
        name,
        companyName: orgName,
        phoneE164,
        roleDefault: "owner",
        passwordHash,
        createdAt: now,
      });
      createdUserId = userId;
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "註冊失敗" };
  }

  const data = await (await import("@/lib/store")).readData();
  const user = data.users.find((u) => u.id === createdUserId);
  if (!user) return { error: "註冊後找不到帳號" };
  await createSession(user);
  redirect("/projects");
}
