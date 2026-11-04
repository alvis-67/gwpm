"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { formatLeadLabel } from "@/lib/format";
import {
  assignableUsers,
  canLeadProject,
  findApprovedAccount,
  managedProject,
  rememberProjectAssignee,
} from "@/lib/permissions";
import { deleteStoredUploads } from "@/lib/uploads";
import { readData, updateData } from "@/lib/store";
import { joinTradeNotes, parseAmount, splitTradeNotes } from "@/lib/money";
import { joinProjectNotes, splitProjectNotes } from "@/lib/project-docs";
import { DEFAULT_TRADE_TEMPLATES, type ProjectStatus } from "@/lib/types";
import { pushNotification } from "@/lib/notifications";

function readTradeName(formData: FormData): string {
  const choice = String(formData.get("nameChoice") || "").trim();
  const custom = String(formData.get("customName") || "").trim();
  if (choice === "__new__") return custom;
  return choice;
}

function readProjectNotes(formData: FormData): string {
  return String(formData.get("notes") || "").replace(/\s+$/, "");
}

/** Same-page redirect reloads the document. Stay put when the user is already there. */
async function redirectUnlessHere(path: string) {
  const referer = (await headers()).get("referer") || "";
  let pathname = "";
  try {
    pathname = new URL(referer).pathname;
  } catch {
    pathname = "";
  }
  if (pathname !== path) redirect(path);
}

export async function createProjectAction(formData: FormData) {
  const user = await requireSession();
  const name = String(formData.get("name") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const clientDisplayName = String(formData.get("clientDisplayName") || "").trim();
  const plannedStart = String(formData.get("plannedStart") || "");
  const plannedEnd = String(formData.get("plannedEnd") || "");
  const notes = readProjectNotes(formData);
  const withTemplates = formData.get("withTemplates") === "on";

  if (!name) throw new Error("工程案名稱（必填）");

  const projectId = createId("proj");
  const now = new Date().toISOString();

  await updateData((data) => {
    let orgId = user.orgId;
    if (isAdmin(user)) {
      orgId = String(formData.get("orgId") || "");
      if (!data.organizations.some((org) => org.id === orgId)) {
        throw new Error("請選擇工程公司");
      }
    }
    data.projects.unshift({
      id: projectId,
      orgId,
      name,
      location,
      clientDisplayName,
      status: "planning",
      plannedStart,
      plannedEnd,
      notes: isAdmin(user) ? notes : joinProjectNotes(notes, "", "", { leadUserId: user.id }),
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
  revalidatePath("/customers", "layout");
  redirect(`/projects/${projectId}`);
}

export async function updateProjectStatusAction(
  projectId: string,
  status: ProjectStatus,
) {
  const user = await requireSession();
  await updateData((data) => {
    const p = managedProject(data, user, projectId);
    if (!p) throw new Error("找不到工程案");
    p.status = status;
    p.updatedAt = new Date().toISOString();
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function updateProjectAction(formData: FormData) {
  const user = await requireSession();
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("工程案名稱（必填）");
  const location = String(formData.get("location") || "").trim();
  const clientDisplayName = String(formData.get("clientDisplayName") || "").trim();
  const plannedStart = String(formData.get("plannedStart") || "");
  const plannedEnd = String(formData.get("plannedEnd") || "");
  const notes = readProjectNotes(formData);
  const status = String(formData.get("status") || "planning") as ProjectStatus;

  await updateData((data) => {
    const p = managedProject(data, user, projectId);
    if (!p) throw new Error("找不到工程案");
    p.name = name;
    p.location = location;
    p.clientDisplayName = clientDisplayName;
    p.plannedStart = plannedStart;
    p.plannedEnd = plannedEnd;
    const kept = splitProjectNotes(p.notes);
    p.notes = joinProjectNotes(notes, kept.quotationNumber, kept.invoiceNumber, {
      leadUserId: kept.leadUserId,
      assigneeIds: kept.assigneeIds,
      comments: kept.comments,
      customerPayment: kept.customerPayment,
    });
    p.status = status;
    p.updatedAt = new Date().toISOString();
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/customers", "layout");
  redirect(`/projects/${projectId}`);
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireSession();
  const projectId = String(formData.get("projectId") || "");
  const removedUploads: string[] = [];
  await updateData((data) => {
    const project = managedProject(data, user, projectId);
    if (!project) throw new Error("無權限");
    const tradeIds = new Set(
      data.trades.filter((trade) => trade.projectId === projectId).map((trade) => trade.id),
    );
    const logIds = new Set(
      data.workLogs.filter((log) => tradeIds.has(log.projectTradeId)).map((log) => log.id),
    );
    for (const photo of data.photos) {
      if (logIds.has(photo.workLogId)) removedUploads.push(photo.url);
    }
    data.projects = data.projects.filter((item) => item.id !== projectId);
    data.trades = data.trades.filter((trade) => trade.projectId !== projectId);
    data.dependencies = data.dependencies.filter((item) => item.projectId !== projectId);
    data.procurements = data.procurements.filter((item) => item.projectId !== projectId);
    data.workLogs = data.workLogs.filter((log) => !tradeIds.has(log.projectTradeId));
    data.photos = data.photos.filter((photo) => !logIds.has(photo.workLogId));
    data.comments = data.comments.filter((comment) => !tradeIds.has(comment.projectTradeId));
    data.notifications = data.notifications.filter(
      (item) =>
        item.entityId !== projectId &&
        !tradeIds.has(item.entityId) &&
        !item.href.startsWith(`/projects/${projectId}`),
    );
  });
  revalidatePath("/projects");
  revalidatePath("/customers", "layout");
  await deleteStoredUploads(removedUploads);
  redirect("/projects");
}

export async function renameTradeAction(formData: FormData) {
  const user = await requireSession();
  const tradeId = String(formData.get("tradeId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("工種名稱（必填）");
  let projectId = "";
  await updateData((data) => {
    const trade = data.trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("找不到工種");
    const project = managedProject(data, user, trade.projectId);
    if (!project) throw new Error("無權限");
    trade.name = name;
    projectId = trade.projectId;
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/trades/${tradeId}`);
}

export async function deleteTradeAction(formData: FormData) {
  const user = await requireSession();
  const tradeId = String(formData.get("tradeId") || "");
  let projectId = "";
  await updateData((data) => {
    const trade = data.trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("找不到工種");
    const project = managedProject(data, user, trade.projectId);
    if (!project) throw new Error("無權限");
    projectId = trade.projectId;
    const logIds = new Set(
      data.workLogs.filter((l) => l.projectTradeId === tradeId).map((l) => l.id),
    );
    data.trades = data.trades.filter((t) => t.id !== tradeId);
    data.dependencies = data.dependencies.filter(
      (d) => d.tradeId !== tradeId && d.dependsOnTradeId !== tradeId,
    );
    data.procurements = data.procurements.map((p) =>
      p.tradeId === tradeId ? { ...p, tradeId: null } : p,
    );
    data.workLogs = data.workLogs.filter((l) => l.projectTradeId !== tradeId);
    data.photos = data.photos.filter((p) => !logIds.has(p.workLogId));
    data.comments = data.comments.filter((c) => c.projectTradeId !== tradeId);
  });
  revalidatePath(`/projects/${projectId}`);
  await redirectUnlessHere(`/projects/${projectId}`);
}

export type AssignTradeState = { error?: string; matchLabel?: string; query?: string } | null;

export async function assignTradeAction(
  _prev: AssignTradeState,
  formData: FormData,
): Promise<AssignTradeState> {
  const user = await requireSession();
  const tradeId = String(formData.get("tradeId") || "");
  const query = String(formData.get("query") || "").trim();
  const save = String(formData.get("intent") || "") === "save";

  const data = await readData();
  const trade = data.trades.find((item) => item.id === tradeId);
  if (!trade) return { error: "找不到工種" };
  const project = managedProject(data, user, trade.projectId);
  if (!project) return { error: "無權限" };
  const match = findApprovedAccount(data, query);
  if (!match) return { error: "找不到此帳號" };
  const matchLabel = formatLeadLabel(match);
  if (!save) return { matchLabel, query };

  try {
    await updateData((next) => {
      const nextTrade = next.trades.find((item) => item.id === tradeId);
      const nextProject = nextTrade && managedProject(next, user, nextTrade.projectId);
      if (!nextTrade || !nextProject) throw new Error("無權限");
      const again = findApprovedAccount(next, query);
      if (!again) throw new Error("找不到此帳號");
      rememberProjectAssignee(next, nextProject, again.id);
      nextTrade.assigneeUserId = again.id;
      pushNotification(next, {
        userId: again.id,
        type: "assigned",
        title: "您已被指派工種",
        body: `${nextProject.name}｜${nextTrade.name}`,
        entityType: "trade",
        entityId: nextTrade.id,
        href: `/projects/${nextTrade.projectId}/trades/${nextTrade.id}`,
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "找不到此帳號";
    if (message === "找不到此帳號" || message === "無權限") return { error: message };
    throw error;
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${trade.projectId}`);
  revalidatePath(`/projects/${trade.projectId}/trades/${tradeId}`);
  revalidatePath("/notifications");
  return { matchLabel, query };
}

export async function updateTradeScheduleAction(formData: FormData) {
  const user = await requireSession();
  const tradeId = String(formData.get("tradeId") || "");
  await updateData((data) => {
    const trade = data.trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("找不到工種");
    const project = managedProject(data, user, trade.projectId);
    if (!project) throw new Error("無權限");
    trade.plannedStart = String(formData.get("plannedStart") || "");
    trade.plannedEnd = String(formData.get("plannedEnd") || "");
    const keptNotes = splitTradeNotes(trade.notes);
    const submitted = String(formData.get("notes") || "");
    trade.notes = joinTradeNotes(submitted || keptNotes.text, keptNotes.amount);
  });
  revalidatePath("/projects");
  revalidatePath("/today");
}

export async function addTradeAction(formData: FormData) {
  const user = await requireSession();
  const projectId = String(formData.get("projectId") || "");
  const name = readTradeName(formData);
  if (!name) throw new Error("工種名稱（必填）");
  await updateData((data) => {
    const project = managedProject(data, user, projectId);
    if (!project) throw new Error("找不到工程案");
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
  const projectId = String(formData.get("projectId") || "");
  const tradeId = String(formData.get("tradeId") || "");
  const dependsOnTradeId = String(formData.get("dependsOnTradeId") || "");
  const requiredStatus = String(formData.get("requiredStatus") || "completed");
  if (!tradeId || !dependsOnTradeId || tradeId === dependsOnTradeId) {
    throw new Error("請選擇有效的前後置工種");
  }
  await updateData((data) => {
    const project = managedProject(data, user, projectId);
    if (!project) throw new Error("找不到工程案");
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
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  await updateData((data) => {
    const project = managedProject(data, user, projectId);
    if (!project) throw new Error("找不到工程案");
    data.dependencies = data.dependencies.filter((d) => d.id !== id);
  });
  revalidatePath(`/projects/${projectId}/dependencies`);
}

export async function setProjectLeadAction(formData: FormData) {
  const user = await requireSession();
  const projectId = String(formData.get("projectId") || "");
  const leadUserId = String(formData.get("leadUserId") || "").trim();

  await updateData((data) => {
    const project = data.projects.find((item) => item.id === projectId);
    if (!project || !canLeadProject(data, user, project.id)) throw new Error("無權限");
    if (leadUserId && !assignableUsers(data).some((candidate) => candidate.id === leadUserId)) {
      throw new Error("請選擇 Leader");
    }
    const kept = splitProjectNotes(project.notes);
    project.notes = joinProjectNotes(kept.text, kept.quotationNumber, kept.invoiceNumber, {
      leadUserId,
      assigneeIds: kept.assigneeIds,
      comments: kept.comments,
      customerPayment: kept.customerPayment,
    });
    project.updatedAt = new Date().toISOString();
  });

  revalidatePath("/me");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function addProjectCommentAction(formData: FormData) {
  const user = await requireSession();
  const projectId = String(formData.get("projectId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("請輸入留言（必填）");

  await updateData((data) => {
    const project = data.projects.find((item) => item.id === projectId);
    if (!project || !canLeadProject(data, user, project.id)) throw new Error("無權限");
    const kept = splitProjectNotes(project.notes);
    project.notes = joinProjectNotes(kept.text, kept.quotationNumber, kept.invoiceNumber, {
      leadUserId: kept.leadUserId,
      assigneeIds: kept.assigneeIds,
      comments: [
        ...kept.comments,
        {
          id: createId("pcmt"),
          authorUserId: user.id,
          body,
          createdAt: new Date().toISOString(),
        },
      ],
      customerPayment: kept.customerPayment,
    });
    project.updatedAt = new Date().toISOString();
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function saveCustomerPaymentAction(formData: FormData) {
  const user = await requireSession();
  const projectId = String(formData.get("projectId") || "");
  const customerPayment = parseAmount(formData.get("customerPayment"));

  await updateData((data) => {
    const project = managedProject(data, user, projectId);
    if (!project) throw new Error("無權限");
    const kept = splitProjectNotes(project.notes);
    project.notes = joinProjectNotes(kept.text, kept.quotationNumber, kept.invoiceNumber, {
      leadUserId: kept.leadUserId,
      assigneeIds: kept.assigneeIds,
      comments: kept.comments,
      customerPayment,
    });
    project.updatedAt = new Date().toISOString();
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function saveTradeAmountAction(formData: FormData) {
  const user = await requireSession();
  const tradeId = String(formData.get("tradeId") || "");
  const amount = parseAmount(formData.get("amount"));
  let projectId = "";

  await updateData((data) => {
    const trade = data.trades.find((item) => item.id === tradeId);
    if (!trade) throw new Error("找不到工種");
    const project = managedProject(data, user, trade.projectId);
    if (!project) throw new Error("無權限");
    projectId = project.id;
    const kept = splitTradeNotes(trade.notes);
    trade.notes = joinTradeNotes(kept.text, amount);
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/trades/${tradeId}`);
}
