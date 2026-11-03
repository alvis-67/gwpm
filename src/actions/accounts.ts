"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { updateData } from "@/lib/store";
import type { Role } from "@/lib/types";

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
