import { canManageProjects, isAdmin, isOwner, type SessionUser } from "./auth";
import { splitProjectNotes } from "./project-docs";
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

export function visibleProjects(data: AppData, user: SessionUser) {
  if (isAdmin(user)) return data.projects;
  const inOrg = orgProjects(data, user.orgId);
  if (isOwner(user)) return inOrg;
  const ids = new Set(
    data.trades
      .filter((t) => t.assigneeUserId === user.id)
      .map((t) => t.projectId),
  );
  for (const project of inOrg) {
    if (splitProjectNotes(project.notes).leadUserId === user.id) ids.add(project.id);
  }
  return inOrg.filter((p) => ids.has(p.id));
}

export function canAccessProject(
  data: AppData,
  user: SessionUser,
  projectId: string,
): boolean {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project || !inCompany(user, project.orgId)) return false;
  return visibleProjects(data, user).some((p) => p.id === projectId);
}

export function canAccessTrade(
  data: AppData,
  user: SessionUser,
  trade: ProjectTrade,
): boolean {
  const project = data.projects.find((p) => p.id === trade.projectId);
  if (!project || !inCompany(user, project.orgId)) return false;
  if (canManageProjects(user)) return true;
  return trade.assigneeUserId === user.id;
}

export function canEditTrade(
  data: AppData,
  user: SessionUser,
  trade: ProjectTrade,
): boolean {
  return canAccessTrade(data, user, trade);
}

export function visibleTradesForProject(
  data: AppData,
  user: SessionUser,
  projectId: string,
) {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project || !inCompany(user, project.orgId)) return [];
  const trades = data.trades
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (canManageProjects(user)) return trades;
  return trades.filter((t) => t.assigneeUserId === user.id);
}

/** A project this user may manage: any company for admin, own company for an owner. */
export function managedProject(
  data: AppData,
  user: SessionUser,
  projectId: string,
): Project | undefined {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project || !canManageProjects(user) || !inCompany(user, project.orgId)) {
    return undefined;
  }
  return project;
}

export function canManageProcurement(user: SessionUser): boolean {
  return canManageProjects(user);
}

export function canReportProcurement(
  data: AppData,
  user: SessionUser,
  tradeId: string | null,
): boolean {
  if (canManageProjects(user)) return true;
  if (!tradeId) return false;
  const trade = data.trades.find((t) => t.id === tradeId);
  if (!trade) return false;
  return canAccessTrade(data, user, trade);
}

export function orgTradeLeads(data: AppData, orgId: string): User[] {
  return orgUsers(data, orgId).filter((u) => u.roleDefault === "trade_lead");
}

/** Trade leads in the company, plus its 工程公司老闆, who can also be the project 負責人. */
export function projectLeadCandidates(data: AppData, orgId: string): User[] {
  const users = orgUsers(data, orgId).filter(
    (user) => user.roleDefault === "owner" || user.roleDefault === "trade_lead",
  );
  return users.sort((a, b) => {
    if (a.roleDefault !== b.roleDefault) return a.roleDefault === "owner" ? -1 : 1;
    return a.name.localeCompare(b.name, "zh-Hant");
  });
}

export function getOrganization(data: AppData, orgId: string) {
  return data.organizations.find((o) => o.id === orgId) || null;
}
