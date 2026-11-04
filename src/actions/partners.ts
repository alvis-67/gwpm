"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageProjects, isAdmin, isOwner, requireSession } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { canLeadProject, rememberProjectAssignee } from "@/lib/permissions";
import { updateData } from "@/lib/store";

const DUPLICATE_EMAIL = "GWPM_DUPLICATE_EMAIL";

export async function createPartnerAction(formData: FormData) {
  const session = await requireSession();
  const admin = isAdmin(session);
  const manager = canManageProjects(session);

  const companyName = String(formData.get("companyName") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const phoneE164 = String(formData.get("phoneE164") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const projectId = String(formData.get("projectId") || "");
  const tradeId = String(formData.get("tradeId") || "");

  if (!companyName) throw new Error("工程公司名稱（必填）");
  if (!name) throw new Error("負責人姓名（必填）");
  if (!email) throw new Error("登入電郵（必填）");
  if (password.length < 6) throw new Error("密碼至少 6 位");
  if (!manager && !projectId) throw new Error("無權限");

  const passwordHash = await hash(password, 10);
  let returnToTrade = "";

  try {
  await updateData((data) => {
    if (!manager) {
      const trade = data.trades.find(
        (item) => item.id === tradeId && item.projectId === projectId,
      );
      if (!trade || !canLeadProject(data, session, projectId)) throw new Error("無權限");
      returnToTrade = `/projects/${projectId}/trades/${tradeId}`;
    }
    const orgId = admin ? String(formData.get("orgId") || "") : session.orgId;
    if (!data.organizations.some((org) => org.id === orgId)) {
      throw new Error("請選擇工程公司");
    }
    if (data.users.some((u) => u.email.toLowerCase() === email)) {
      const duplicate = new Error("此電郵已存在");
      duplicate.name = DUPLICATE_EMAIL;
      throw duplicate;
    }
    const userId = createId("user");
    data.users.push({
      id: userId,
      orgId,
      email,
      name,
      companyName,
      phoneE164,
      roleDefault: "trade_lead",
      accountStatus: "approved",
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    const project = data.projects.find((item) => item.id === projectId);
    if (
      project &&
      (canLeadProject(data, session, project.id) ||
        (isOwner(session) && session.orgId === project.orgId))
    ) {
      rememberProjectAssignee(data, project, userId);
    }
  });
  } catch (error) {
    if (error instanceof Error && error.name === DUPLICATE_EMAIL) {
      return { error: "此電郵已存在" };
    }
    throw error;
  }

  revalidatePath("/partners");
  if (returnToTrade) {
    revalidatePath(returnToTrade);
    redirect(returnToTrade);
  }
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
