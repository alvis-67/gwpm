"use server";

import { revalidatePath } from "next/cache";
import { createSession, requireSession } from "@/lib/auth";
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
