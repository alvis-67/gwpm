"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { updateData } from "@/lib/store";

export async function markNotificationReadAction(id: string) {
  const user = await requireSession();
  await updateData((data) => {
    const n = data.notifications.find((x) => x.id === id && x.userId === user.id);
    if (n && !n.readAt) n.readAt = new Date().toISOString();
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireSession();
  const now = new Date().toISOString();
  await updateData((data) => {
    for (const n of data.notifications) {
      if (n.userId === user.id && !n.readAt) n.readAt = now;
    }
  });
  revalidatePath("/notifications");
}
