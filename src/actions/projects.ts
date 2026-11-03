"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, isOwner } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { updateData } from "@/lib/store";
import { DEFAULT_TRADE_TEMPLATES, type ProjectStatus } from "@/lib/types";
import { pushNotification } from "@/lib/notifications";

export async function createProjectAction(formData: FormData) {
  const user = await requireSession();
  if (!isOwner(user)) throw new Error("無權限");

  const name = String(formData.get("name") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const clientDisplayName = String(formData.get("clientDisplayName") || "").trim();
  const plannedStart = String(formData.get("plannedStart") || "");
  const plannedEnd = String(formData.get("plannedEnd") || "");
  const notes = String(formData.get("notes") || "");
  const withTemplates = formData.get("withTemplates") === "on";

  if (!name) throw new Error("工程案名稱（必填）");

  const projectId = createId("proj");
  const now = new Date().toISOString();

  await updateData((data) => {
    data.projects.unshift({
      id: projectId,
      name,
      location,
      clientDisplayName,
      status: "planning",
      plannedStart,
      plannedEnd,
      notes,
      createdAt: now,
      updatedAt: now,
    });
    if (withTemplates) {
      DEFAULT_TRADE_TEMPLATES.forEach((tradeName, i) => {
        data.trades.push({
          id: createId("trade"),
          projectId,
          name: tradeName,
          assigneeUserId: null,
          status: "not_started",
          plannedStart: plannedStart || "",
          plannedEnd: plannedEnd || "",
          actualStart: null,
          actualEnd: null,
          sortOrder: i + 1,
          notes: "",
        });
      });
    }
  });

  revalidatePath("/projects");
  redirect(`/projects/${projectId}`);
}

export async function updateProjectStatusAction(
  projectId: string,
  status: ProjectStatus,
) {
  const user = await requireSession();
  if (!isOwner(user)) throw new Error("無權限");
  await updateData((data) => {
    const p = data.projects.find((x) => x.id === projectId);
    if (!p) throw new Error("找不到工程案");
    p.status = status;
    p.updatedAt = new Date().toISOString();
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function assignTradeAction(formData: FormData) {
  const user = await requireSession();
  if (!isOwner(user)) throw new Error("無權限");
  const tradeId = String(formData.get("tradeId") || "");
  const assigneeUserId = String(formData.get("assigneeUserId") || "") || null;

  await updateData((data) => {
    const trade = data.trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("找不到工種");
    trade.assigneeUserId = assigneeUserId;
    if (assigneeUserId) {
      const project = data.projects.find((p) => p.id === trade.projectId);
      pushNotification(data, {
        userId: assigneeUserId,
        type: "assigned",
        title: "您已被指派工種",
        body: `${project?.name || "工程"}｜${trade.name}`,
        entityType: "trade",
        entityId: trade.id,
        href: `/projects/${trade.projectId}/trades/${trade.id}`,
      });
    }
  });

  revalidatePath("/projects");
  revalidatePath("/notifications");
}

export async function updateTradeScheduleAction(formData: FormData) {
  const user = await requireSession();
  if (!isOwner(user)) throw new Error("無權限");
  const tradeId = String(formData.get("tradeId") || "");
  await updateData((data) => {
    const trade = data.trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("找不到工種");
    trade.plannedStart = String(formData.get("plannedStart") || "");
    trade.plannedEnd = String(formData.get("plannedEnd") || "");
    trade.notes = String(formData.get("notes") || trade.notes);
  });
  revalidatePath("/projects");
  revalidatePath("/today");
}

export async function addTradeAction(formData: FormData) {
  const user = await requireSession();
  if (!isOwner(user)) throw new Error("無權限");
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("工種名稱（必填）");
  await updateData((data) => {
    const max = data.trades
      .filter((t) => t.projectId === projectId)
      .reduce((m, t) => Math.max(m, t.sortOrder), 0);
    data.trades.push({
      id: createId("trade"),
      projectId,
      name,
      assigneeUserId: null,
      status: "not_started",
      plannedStart: "",
      plannedEnd: "",
      actualStart: null,
      actualEnd: null,
      sortOrder: max + 1,
      notes: "",
    });
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function addDependencyAction(formData: FormData) {
  const user = await requireSession();
  if (!isOwner(user)) throw new Error("無權限");
  const projectId = String(formData.get("projectId") || "");
  const tradeId = String(formData.get("tradeId") || "");
  const dependsOnTradeId = String(formData.get("dependsOnTradeId") || "");
  const requiredStatus = String(formData.get("requiredStatus") || "completed");
  if (!tradeId || !dependsOnTradeId || tradeId === dependsOnTradeId) {
    throw new Error("請選擇有效的前後置工種");
  }
  await updateData((data) => {
    data.dependencies.push({
      id: createId("dep"),
      projectId,
      tradeId,
      dependsOnTradeId,
      requiredStatus: requiredStatus as never,
    });
  });
  revalidatePath(`/projects/${projectId}/dependencies`);
}

export async function deleteDependencyAction(formData: FormData) {
  const user = await requireSession();
  if (!isOwner(user)) throw new Error("無權限");
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  await updateData((data) => {
    data.dependencies = data.dependencies.filter((d) => d.id !== id);
  });
  revalidatePath(`/projects/${projectId}/dependencies`);
}
