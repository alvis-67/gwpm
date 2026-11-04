import { accountStatusOf } from "./account-status";
import { isAdmin, type SessionUser } from "./auth";
import { joinProjectNotes, splitProjectNotes } from "./project-docs";
import type { AppData, Project, ProjectTrade, User } from "./types";

export function orgUsers(data: AppData, orgId: string): User[] {
  return data.users.filter((u) => u.orgId === orgId);
}

export function orgProjects(data: AppData, orgId: string): Project[] {
  return data.projects.filter((p) => p.orgId === orgId);
}

/** Admin is not limited to one company. Everyone else stays inside their own. */
export function inCompany(user: SessionUser, orgId: string): boolean {
  return isAdmin(user) || user.orgId === orgId;
}

export function projectLeaderId(project: Project): string {
  return splitProjectNotes(project.notes).leadUserId;
}

export function isProjectLeader(user: { id: string }, project: Project): boolean {
  const leaderId = projectLeaderId(project);
  return leaderId !== "" && leaderId === user.id;
}

/** Level-2 on this project: the project's Leader, or the system admin. */
export function canLeadProject(
  data: AppData,
  user: SessionUser,
  projectId: string,
): boolean {
  if (isAdmin(user)) return true;
  const project = data.projects.find((item) => item.id === projectId);
  return Boolean(project && isProjectLeader(user, project));
}

export function visibleProjects(data: AppData, user: SessionUser) {
  if (isAdmin(user)) return data.projects;
  const ids = new Set<string>();
  for (const project of data.projects) {
    if (isProjectLeader(user, project)) ids.add(project.id);
  }
  for (const trade of data.trades) {
    if (trade.assigneeUserId === user.id) ids.add(trade.projectId);
  }
  return data.projects.filter((project) => ids.has(project.id));
}

/** The Leader sees the customer. A trade assignee does not. */
export function visibleCustomerProjects(data: AppData, user: SessionUser) {
  if (isAdmin(user)) return data.projects;
  return data.projects.filter((project) => isProjectLeader(user, project));
}

export function canAccessProject(
  data: AppData,
  user: SessionUser,
  projectId: string,
): boolean {
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return false;
  return visibleProjects(data, user).some((item) => item.id === projectId);
}

export function canAccessTrade(
  data: AppData,
  user: SessionUser,
  trade: ProjectTrade,
): boolean {
  const project = data.projects.find((item) => item.id === trade.projectId);
  if (!project) return false;
  if (canLeadProject(data, user, project.id)) return true;
  return trade.assigneeUserId === user.id;
}

/** Level-2 (this project's Leader or admin) or the one 負責人 of this trade. */
export function canEditTrade(
  data: AppData,
  user: SessionUser,
  trade: ProjectTrade,
): boolean {
  if (canLeadProject(data, user, trade.projectId)) return true;
  return trade.assigneeUserId === user.id;
}

export function visibleTradesForProject(
  data: AppData,
  user: SessionUser,
  projectId: string,
) {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project || !canAccessProject(data, user, projectId)) return [];
  const trades = data.trades
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (canLeadProject(data, user, projectId)) return trades;
  return trades.filter((t) => t.assigneeUserId === user.id);
}

/** Level-2 management of this project: its Leader, or the system admin. */
export function managedProject(
  data: AppData,
  user: SessionUser,
  projectId: string,
): Project | undefined {
  if (!canLeadProject(data, user, projectId)) return undefined;
  return data.projects.find((project) => project.id === projectId);
}

export function canManageProcurement(data: AppData, user: SessionUser, projectId: string): boolean {
  return canLeadProject(data, user, projectId);
}

export function canReportProcurement(
  data: AppData,
  user: SessionUser,
  tradeId: string | null,
): boolean {
  if (!tradeId) return false;
  const trade = data.trades.find((t) => t.id === tradeId);
  if (!trade) return false;
  if (canLeadProject(data, user, trade.projectId)) return true;
  return trade.assigneeUserId === user.id;
}

export function orgTradeLeads(data: AppData, orgId: string): User[] {
  return orgUsers(data, orgId).filter((u) => u.roleDefault === "trade_lead");
}

/**
 * People stored on this project: its Leader, current trade assignees, and ids
 * saved on the project. Choosing someone does not add them to any other project.
 */
export function projectAssigneeIds(data: AppData, project: Project): string[] {
  const docs = splitProjectNotes(project.notes);
  const ids = new Set<string>();
  if (docs.leadUserId) ids.add(docs.leadUserId);
  for (const id of docs.assigneeIds) ids.add(id);
  for (const trade of data.trades) {
    if (trade.projectId === project.id && trade.assigneeUserId) ids.add(trade.assigneeUserId);
  }
  return [...ids];
}

export function projectAssignees(data: AppData, projectId: string): User[] {
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return [];
  const ids = new Set(projectAssigneeIds(data, project));
  return data.users
    .filter((user) => ids.has(user.id))
    .sort((a, b) => {
      const company = a.companyName.localeCompare(b.companyName, "zh-Hant");
      if (company !== 0) return company;
      return a.name.localeCompare(b.name, "zh-Hant");
    });
}

/** Keep a person on this project's 指派負責人 list without adding them to any other project. */
export function rememberProjectAssignee(data: AppData, project: Project, userId: string | null) {
  const docs = splitProjectNotes(project.notes);
  const ids = new Set(projectAssigneeIds(data, project));
  if (userId) ids.add(userId);
  project.notes = joinProjectNotes(docs.text, docs.quotationNumber, docs.invoiceNumber, {
    leadUserId: docs.leadUserId,
    comments: docs.comments,
    assigneeIds: [...ids],
  });
}

/** Approved company bosses and trade 負責人. Pending and rejected accounts are not assignable. */
export function assignableUsers(data: AppData): User[] {
  return data.users
    .filter(
      (user) =>
        (user.roleDefault === "owner" || user.roleDefault === "trade_lead") &&
        accountStatusOf(user) === "approved",
    )
    .sort((a, b) => {
      const company = a.companyName.localeCompare(b.companyName, "zh-Hant");
      if (company !== 0) return company;
      return a.name.localeCompare(b.name, "zh-Hant");
    });
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** One approved owner or trade_lead, matched by exact email or exact phone. */
export function findApprovedAccount(data: AppData, query: string): User | null {
  const raw = query.trim();
  if (!raw) return null;
  const pool = assignableUsers(data);
  let matches: User[];
  if (raw.includes("@")) {
    const email = raw.toLowerCase();
    matches = pool.filter((user) => user.email.toLowerCase() === email);
  } else {
    const digits = phoneDigits(raw);
    if (!digits) return null;
    matches = pool.filter((user) => {
      const phone = user.phoneE164.trim();
      if (!phone) return false;
      return phone === raw || phoneDigits(phone) === digits;
    });
  }
  return matches.length === 1 ? matches[0] : null;
}

export function getOrganization(data: AppData, orgId: string) {
  return data.organizations.find((o) => o.id === orgId) || null;
}
