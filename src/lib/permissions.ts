import type { AppData, ProjectTrade } from "./types";
import { isOwner, type SessionUser } from "./auth";

export function visibleProjects(data: AppData, user: SessionUser) {
  if (isOwner(user)) return data.projects;
  const ids = new Set(
    data.trades
      .filter((t) => t.assigneeUserId === user.id)
      .map((t) => t.projectId),
  );
  return data.projects.filter((p) => ids.has(p.id));
}

export function canAccessProject(
  data: AppData,
  user: SessionUser,
  projectId: string,
): boolean {
  return visibleProjects(data, user).some((p) => p.id === projectId);
}

export function canAccessTrade(
  _data: AppData,
  user: SessionUser,
  trade: ProjectTrade,
): boolean {
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
  return Boolean(trade && trade.assigneeUserId === user.id);
}
