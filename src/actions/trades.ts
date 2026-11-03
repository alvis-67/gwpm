"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { evaluateDependency } from "@/lib/dependencies";
import { pushNotification } from "@/lib/notifications";
import { canEditTrade, canLeadProject, projectLeaderId } from "@/lib/permissions";
import { saveUpload, updateData } from "@/lib/store";
import { TRADE_STATUSES, type TradeStatus } from "@/lib/types";
import { tradeStatusLabel } from "@/lib/labels";

export async function updateTradeStatusAction(
  tradeId: string,
  status: TradeStatus,
) {
  const user = await requireSession();
  if (!TRADE_STATUSES.includes(status)) throw new Error("非法狀態");

  await updateData((data) => {
    const trade = data.trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("找不到工種");
    if (!canEditTrade(data, user, trade)) throw new Error("無權限");

    const prev = trade.status;
    trade.status = status;
    if (status === "in_progress" && !trade.actualStart) {
      trade.actualStart = new Date().toISOString().slice(0, 10);
    }
    if (status === "completed") {
      trade.actualEnd = new Date().toISOString().slice(0, 10);
    }

    const project = data.projects.find((p) => p.id === trade.projectId);
    if (!project) throw new Error("無權限");
    const recipients = new Set<string>();
    const leaderId = projectLeaderId(project);
    if (leaderId) recipients.add(leaderId);
    else {
      data.users
        .filter((u) => u.roleDefault === "owner" && u.orgId === project.orgId)
        .forEach((u) => recipients.add(u.id));
    }
    if (trade.assigneeUserId) recipients.add(trade.assigneeUserId);
    recipients.delete(user.id);

    for (const uid of recipients) {
      pushNotification(data, {
        userId: uid,
        type: "status_change",
        title: "工種狀態變更",
        body: `${project?.name || ""}｜${trade.name}：${tradeStatusLabel[prev]} → ${tradeStatusLabel[status]}`,
        entityType: "trade",
        entityId: trade.id,
        href: `/projects/${trade.projectId}/trades/${trade.id}`,
      });
    }

    // Notify when blocked deps become ready
    for (const dependent of data.trades.filter((t) => t.projectId === trade.projectId)) {
      const deps = data.dependencies.filter(
        (d) => d.tradeId === dependent.id && d.dependsOnTradeId === trade.id,
      );
      if (deps.length === 0) continue;
      const hint = evaluateDependency(data, dependent);
      if (hint.kind === "ready" && dependent.assigneeUserId) {
        pushNotification(data, {
          userId: dependent.assigneeUserId,
          type: "dependency_ready",
          title: "可進場",
          body: `${project?.name || ""}｜${dependent.name} 前置條件已滿足`,
          entityType: "trade",
          entityId: dependent.id,
          href: `/projects/${dependent.projectId}/trades/${dependent.id}`,
        });
      }
    }
  });

  revalidatePath("/projects");
  revalidatePath("/today");
  revalidatePath("/notifications");
}

export async function addWorkLogAction(formData: FormData) {
  const user = await requireSession();
  const tradeId = String(formData.get("tradeId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("請填寫日誌內容（必填）");

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  await updateData(async (data) => {
    const trade = data.trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("找不到工種");
    if (!canEditTrade(data, user, trade)) throw new Error("無權限");

    const logId = createId("log");
    data.workLogs.unshift({
      id: logId,
      projectTradeId: tradeId,
      authorUserId: user.id,
      body,
      createdAt: new Date().toISOString(),
    });

    for (const file of files.slice(0, 6)) {
      const buf = Buffer.from(await file.arrayBuffer());
      const url = await saveUpload(file.name || "photo.jpg", buf, file.type || "image/jpeg");
      data.photos.push({
        id: createId("photo"),
        workLogId: logId,
        url,
        width: 0,
        height: 0,
        createdAt: new Date().toISOString(),
      });
    }
  });

  revalidatePath(`/projects`);
}

export async function addCommentAction(formData: FormData) {
  const user = await requireSession();
  const tradeId = String(formData.get("tradeId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("請輸入留言（必填）");

  await updateData((data) => {
    const trade = data.trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("找不到工種");
    if (!canEditTrade(data, user, trade)) throw new Error("無權限");

    data.comments.push({
      id: createId("cmt"),
      projectTradeId: tradeId,
      authorUserId: user.id,
      body,
      createdAt: new Date().toISOString(),
    });

    const project = data.projects.find((p) => p.id === trade.projectId);
    if (!project) throw new Error("無權限");
    const recipients = new Set<string>();
    if (canLeadProject(data, user, project.id)) {
      if (trade.assigneeUserId) recipients.add(trade.assigneeUserId);
    } else {
      const leaderId = projectLeaderId(project);
      if (leaderId) recipients.add(leaderId);
      else {
        data.users
          .filter((u) => u.roleDefault === "owner" && u.orgId === project.orgId)
          .forEach((u) => recipients.add(u.id));
      }
    }
    recipients.delete(user.id);
    for (const uid of recipients) {
      pushNotification(data, {
        userId: uid,
        type: "comment",
        title: "新留言",
        body: `${user.name} 於「${trade.name}」留言`,
        entityType: "trade",
        entityId: trade.id,
        href: `/projects/${trade.projectId}/trades/${trade.id}/comments`,
      });
    }
  });

  revalidatePath("/notifications");
  revalidatePath("/projects");
}
