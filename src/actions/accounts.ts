"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/admin-account";
import { createId } from "@/lib/ids";
import { updateData } from "@/lib/store";
import type { AppData, Role } from "@/lib/types";

function isLockedAccount(user: { id: string; email: string }, sessionId: string): boolean {
  return user.id === sessionId || user.email.toLowerCase() === ADMIN_EMAIL;
}

function parseRole(value: unknown): Extract<Role, "owner" | "trade_lead"> | null {
  if (value === "owner" || value === "trade_lead") return value;
  return null;
}

/**
 * Admin creates a login for an engineering-company owner or a project member.
 * Does not create another admin and does not use Supabase Auth.
 */
export async function createOrgAccountAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "無權限" };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = parseRole(formData.get("role"));
  const companyName = String(formData.get("companyName") || "").trim();
  const phoneE164 = String(formData.get("phoneE164") || "").trim();
  const orgChoice = String(formData.get("orgId") || "");
  const newOrgName = String(formData.get("newOrgName") || "").trim();

  if (!name) return { error: "姓名（必填）" };
  if (!email) return { error: "電郵（必填）" };
  if (!role) return { error: "請選擇角色" };
  if (password.length < 6) return { error: "密碼至少 6 位" };
  if (orgChoice === "__new__" && !newOrgName) return { error: "新公司名稱（必填）" };
  if (!orgChoice) return { error: "請選擇工程公司" };

  try {
    await updateData(async (data) => {
      if (data.users.some((user) => user.email.toLowerCase() === email)) {
        throw new Error("此電郵已存在");
      }
      let orgId = orgChoice;
      let orgName = newOrgName;
      if (orgChoice === "__new__") {
        orgId = createId("org");
        data.organizations.push({
          id: orgId,
          name: newOrgName,
          createdAt: new Date().toISOString(),
        });
      } else {
        const org = data.organizations.find((item) => item.id === orgChoice);
        if (!org) throw new Error("找不到工程公司");
        orgName = org.name;
      }
      data.users.push({
        id: createId("user"),
        orgId,
        email,
        name,
        companyName: companyName || orgName,
        phoneE164,
        roleDefault: role,
        passwordHash: await hash(password, 10),
        createdAt: new Date().toISOString(),
      });
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "建立失敗" };
  }

  redirect("/accounts");
}

function detachUser(data: AppData, userId: string) {
  const fallback =
    data.users.find((user) => user.email.toLowerCase() === ADMIN_EMAIL && user.id !== userId)?.id ??
    null;
  data.users = data.users.filter((user) => user.id !== userId);
  for (const trade of data.trades) {
    if (trade.assigneeUserId === userId) trade.assigneeUserId = null;
  }
  if (fallback) {
    for (const log of data.workLogs) {
      if (log.authorUserId === userId) log.authorUserId = fallback;
    }
    for (const comment of data.comments) {
      if (comment.authorUserId === userId) comment.authorUserId = fallback;
    }
  } else {
    const logIds = new Set(
      data.workLogs.filter((log) => log.authorUserId === userId).map((log) => log.id),
    );
    data.workLogs = data.workLogs.filter((log) => log.authorUserId !== userId);
    data.photos = data.photos.filter((photo) => !logIds.has(photo.workLogId));
    data.comments = data.comments.filter((comment) => comment.authorUserId !== userId);
  }
  data.notifications = data.notifications.filter((notification) => notification.userId !== userId);
}

export async function updateAccountAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "無權限" };

  const userId = String(formData.get("userId") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = parseRole(formData.get("role"));
  const companyName = String(formData.get("companyName") || "").trim();
  const phoneE164 = String(formData.get("phoneE164") || "").trim();
  const password = String(formData.get("password") || "");
  const orgChoice = String(formData.get("orgId") || "");
  const newOrgName = String(formData.get("newOrgName") || "").trim();

  if (!name) return { error: "姓名（必填）" };
  if (!email) return { error: "電郵（必填）" };

  try {
    await updateData(async (data) => {
      const user = data.users.find((item) => item.id === userId);
      if (!user) throw new Error("找不到帳號");
      if (data.users.some((item) => item.id !== userId && item.email.toLowerCase() === email)) {
        throw new Error("此電郵已存在");
      }

      if (isLockedAccount(user, session.id)) {
        if (email !== user.email.toLowerCase()) throw new Error("不能更改系統管理員電郵");
        if (role && role !== user.roleDefault) throw new Error("不能更改系統管理員角色");
        if (password) throw new Error("請到「我的」變更自己的密碼");
        user.name = name;
        user.phoneE164 = phoneE164;
        if (companyName) user.companyName = companyName;
        return;
      }

      if (!role) throw new Error("請選擇角色");
      if (email === ADMIN_EMAIL) throw new Error("不能使用此電郵");
      if (password && password.length < 6) throw new Error("密碼至少 6 位");
      if (orgChoice === "__new__" && !newOrgName) throw new Error("新公司名稱（必填）");
      if (!orgChoice) throw new Error("請選擇工程公司");

      let orgId = orgChoice;
      let orgName = newOrgName;
      if (orgChoice === "__new__") {
        orgId = createId("org");
        data.organizations.push({
          id: orgId,
          name: newOrgName,
          createdAt: new Date().toISOString(),
        });
      } else {
        const org = data.organizations.find((item) => item.id === orgChoice);
        if (!org) throw new Error("找不到工程公司");
        orgName = org.name;
      }

      user.orgId = orgId;
      user.email = email;
      user.name = name;
      user.companyName = companyName || orgName;
      user.phoneE164 = phoneE164;
      user.roleDefault = role;
      if (password) user.passwordHash = await hash(password, 10);
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "儲存失敗" };
  }

  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function deleteAccountAction(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) throw new Error("無權限");
  const userId = String(formData.get("userId") || "");

  await updateData((data) => {
    const user = data.users.find((item) => item.id === userId);
    if (!user) throw new Error("找不到帳號");
    if (isLockedAccount(user, session.id)) throw new Error("不能刪除系統管理員帳號");
    detachUser(data, user.id);
  });

  revalidatePath("/accounts");
  revalidatePath("/projects");
  redirect("/accounts");
}
