"use server";

import { hash } from "bcryptjs";
import { encodeAccountPassword } from "@/lib/account-status";
import { createId } from "@/lib/ids";
import { updateData } from "@/lib/store";

const DUPLICATE_EMAIL = "GWPM_DUPLICATE_EMAIL";

export type RegisterState = { error?: string; ok?: boolean } | null;

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!email) return { error: "電郵（必填）" };
  if (password.length < 6) return { error: "密碼至少 6 位" };
  if (!name) return { error: "姓名（必填）" };
  if (!company) return { error: "公司（必填）" };
  if (!phone) return { error: "電話（必填）" };

  const passwordHash = encodeAccountPassword(await hash(password, 10), "pending");

  try {
    await updateData((data) => {
      if (data.users.some((user) => user.email.toLowerCase() === email)) {
        const duplicate = new Error("此電郵已存在");
        duplicate.name = DUPLICATE_EMAIL;
        throw duplicate;
      }
      const now = new Date().toISOString();
      const orgId = createId("org");
      data.organizations.push({
        id: orgId,
        name: company,
        createdAt: now,
      });
      data.users.push({
        id: createId("user"),
        orgId,
        email,
        name,
        companyName: company,
        phoneE164: phone,
        roleDefault: "trade_lead",
        accountStatus: "pending",
        passwordHash,
        createdAt: now,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.name === DUPLICATE_EMAIL) {
      return { error: "此電郵已存在" };
    }
    throw error;
  }

  return { ok: true };
}
