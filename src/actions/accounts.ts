"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { requireSession, isOwner } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { updateData } from "@/lib/store";
import type { Role } from "@/lib/types";

function parseRole(value: unknown): Role | null {
  if (value === "owner" || value === "trade_lead") return value;
  return null;
}

/**
 * Owner creates a login inside their own organization.
 * Does not create a new company and does not use Supabase Auth.
 */
export async function createOrgAccountAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!isOwner(session)) return { error: "無權限" };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = parseRole(formData.get("role"));
  const companyName = String(formData.get("companyName") || "").trim();
  const phoneE164 = String(formData.get("phoneE164") || "").trim();

  if (!name) return { error: "姓名（必填）" };
  if (!email) return { error: "電郵（必填）" };
  if (!role) return { error: "請選擇角色" };
  if (password.length < 6) return { error: "密碼至少 6 位" };

  try {
    await updateData(async (data) => {
      if (!data.organizations.some((org) => org.id === session.orgId)) {
        throw new Error("找不到所屬公司");
      }
      if (data.users.some((user) => user.email.toLowerCase() === email)) {
        throw new Error("此電郵已存在");
      }
      const orgName =
        data.organizations.find((org) => org.id === session.orgId)?.name || "";
      data.users.push({
        id: createId("user"),
        orgId: session.orgId,
        email,
        name,
        companyName: companyName || (role === "owner" ? orgName : ""),
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
