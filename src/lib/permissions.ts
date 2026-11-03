import type { AppData, Project, ProjectTrade, User } from "./types";
import { isOwner, type SessionUser } from "./auth";

export function orgUsers(data: AppData, orgId: string): User[] {
  return data.users.filter((u) => u.orgId === orgId);
}

export function orgProjects(data: AppData, orgId: string): Project[] {
  return data.projects.filter((p) => p.orgId === orgId);
}

export function visibleProjects(data: AppData, user: SessionUser) {
  const inOrg = orgProjects(data, user.orgId);
  if (isOwner(user)) return inOrg;
  const ids = new Set(
    data.trades
      .filter((t) => t.assigneeUserId === user.id)
      .map((t) => t.projectId),
  );
  return inOrg.filter((p) => ids.has(p.id));
}

export function canAccessProject(
  data: AppData,
  user: SessionUser,
  projectId: string,
): boolean {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project || project.orgId !== user.orgId) return false;
  return visibleProjects(data, user).some((p) => p.id === projectId);
}

export function canAccessTrade(
  data: AppData,
  user: SessionUser,
  trade: ProjectTrade,
): boolean {
  const project = data.projects.find((p) => p.id === trade.projectId);
  if (!project || project.orgId !== user.orgId) return false;
  if (isOwner(user)) return true;
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
  if (!project || project.orgId !== user.orgId) return [];
  const trades = data.trades
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (isOwner(user)) return trades;
  return trades.filter((t) => t.assigneeUserId === user.id);
}

export function canManageProcurement(user: SessionUser): boolean {
  return isOwner(user);
}

export function canReportProcurement(
  data: AppData,
  user: SessionUser,
  tradeId: string | null,
): boolean {
  if (isOwner(user)) return true;
  if (!tradeId) return false;
  const trade = data.trades.find((t) => t.id === tradeId);
  if (!trade) return false;
  return canAccessTrade(data, user, trade);
}

export function orgTradeLeads(data: AppData, orgId: string): User[] {
  return orgUsers(data, orgId).filter((u) => u.roleDefault === "trade_lead");
}

export function getOrganization(data: AppData, orgId: string) {
  return data.organizations.find((o) => o.id === orgId) || null;
}
