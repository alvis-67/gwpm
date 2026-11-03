"use server";

import { revalidatePath } from "next/cache";
import { canManageProjects, requireSession } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { pushNotification } from "@/lib/notifications";
import { canReportProcurement, inCompany, managedProject } from "@/lib/permissions";
import { updateData } from "@/lib/store";
import {
  PROCUREMENT_STATUSES,
  type ProcurementStatus,
} from "@/lib/types";
import { procurementStatusLabel } from "@/lib/labels";

export async function createProcurementAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageProjects(user)) throw new Error("無權限");
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("採購項目名稱（必填）");
  const tradeId = String(formData.get("tradeId") || "") || null;
  const qty = Number(formData.get("qty") || 1);
  const unit = String(formData.get("unit") || "件");
  const supplierNote = String(formData.get("supplierNote") || "");
  const status = String(formData.get("status") || "todo") as ProcurementStatus;

  await updateData((data) => {
    const project = managedProject(data, user, projectId);
    if (!project) throw new Error("找不到工程案");
    data.procurements.unshift({
      id: createId("proc"),
      projectId,
      tradeId,
      name,
      qty: Number.isFinite(qty) ? qty : 1,
      unit,
      status: PROCUREMENT_STATUSES.includes(status) ? status : "todo",
      supplierNote,
      updatedAt: new Date().toISOString(),
    });
  });

  revalidatePath(`/projects/${projectId}/procurement`);
}

export async function updateProcurementStatusAction(formData: FormData) {
  const user = await requireSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ProcurementStatus;
  if (!PROCUREMENT_STATUSES.includes(status)) throw new Error("非法狀態");

  await updateData((data) => {
    const item = data.procurements.find((p) => p.id === id);
    if (!item) throw new Error("找不到採購項目");
    if (!canReportProcurement(data, user, item.tradeId)) {
      throw new Error("無權限");
    }
    // Trade leads can only report received / shortage
    if (!canManageProjects(user) && status !== "received" && status !== "shortage") {
      throw new Error("項目成員僅可回報已到或缺料");
    }
    item.status = status;
    item.updatedAt = new Date().toISOString();

    const project = data.projects.find((p) => p.id === item.projectId);
    if (!project || !inCompany(user, project.orgId)) throw new Error("無權限");
    for (const owner of data.users.filter(
      (u) => u.roleDefault === "owner" && u.orgId === project.orgId,
    )) {
      if (owner.id === user.id) continue;
      pushNotification(data, {
        userId: owner.id,
        type: "procurement",
        title: "採購狀態更新",
        body: `${project.name}｜${item.name} → ${procurementStatusLabel[status]}`,
        entityType: "procurement",
        entityId: item.id,
        href: `/projects/${item.projectId}/procurement`,
      });
    }
  });

  revalidatePath("/projects");
  revalidatePath("/notifications");
}
