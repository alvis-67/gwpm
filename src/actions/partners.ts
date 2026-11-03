"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageProjects, isAdmin, requireSession } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { updateData } from "@/lib/store";

export async function createPartnerAction(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) throw new Error("無權限");

  const companyName = String(formData.get("companyName") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const phoneE164 = String(formData.get("phoneE164") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const orgId = String(formData.get("orgId") || "");

  if (!companyName) throw new Error("工程公司名稱（必填）");
  if (!name) throw new Error("負責人姓名（必填）");
  if (!email) throw new Error("登入電郵（必填）");
  if (password.length < 6) throw new Error("密碼至少 6 位");

  const passwordHash = await hash(password, 10);

  await updateData((data) => {
    if (!data.organizations.some((org) => org.id === orgId)) {
      throw new Error("請選擇工程公司");
    }
    if (data.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error("此電郵已存在");
    }
    data.users.push({
      id: createId("user"),
      orgId,
      email,
      name,
      companyName,
      phoneE164,
      roleDefault: "trade_lead",
      passwordHash,
      createdAt: new Date().toISOString(),
    });
  });

  revalidatePath("/partners");
  redirect("/partners");
}

export async function updatePartnerAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageProjects(session)) throw new Error("無權限");

  const userId = String(formData.get("userId") || "");
  const companyName = String(formData.get("companyName") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const phoneE164 = String(formData.get("phoneE164") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!companyName) throw new Error("工程公司名稱（必填）");
  if (!name) throw new Error("負責人姓名（必填）");
  if (!email) throw new Error("登入電郵（必填）");

  await updateData(async (data) => {
    const user = data.users.find(
      (u) =>
        u.id === userId &&
        u.roleDefault === "trade_lead" &&
        (isAdmin(session) || u.orgId === session.orgId),
    );
    if (!user) throw new Error("找不到負責人");
    if (
      data.users.some(
        (u) => u.id !== userId && u.email.toLowerCase() === email,
      )
    ) {
      throw new Error("此電郵已存在");
    }
    user.companyName = companyName;
    user.name = name;
    user.phoneE164 = phoneE164;
    user.email = email;
    if (isAdmin(session) && password.length >= 6) {
      user.passwordHash = await hash(password, 10);
    }
  });

  revalidatePath("/partners");
  redirect("/partners");
}
