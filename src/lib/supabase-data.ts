import {
  PROCUREMENT_STATUSES,
  PROJECT_STATUSES,
  TRADE_STATUSES,
  type AppData,
  type Notification,
  type NotificationType,
  type Organization,
  type ProcurementItem,
  type Project,
  type ProjectTrade,
  type Role,
  type TradeComment,
  type TradeDependency,
  type User,
  type WorkLog,
  type WorkLogPhoto,
} from "./types";
import { ADMIN_EMAIL } from "./admin-account";

/** Keys `gwpm_replace_data` / `gwpm_load_data` exchange. Camel case matches AppData. */
export const SUPABASE_PAYLOAD_KEYS = [
  "organizations",
  "users",
  "projects",
  "trades",
  "dependencies",
  "procurements",
  "workLogs",
  "photos",
  "comments",
  "notifications",
] as const;

const NOTIFICATION_TYPES: readonly NotificationType[] = [
  "assigned",
  "tomorrow_entry",
  "status_change",
  "comment",
  "procurement",
  "dependency_ready",
];

const ROLES: readonly Role[] = ["admin", "owner", "trade_lead"];

export type SupabasePayload = {
  organizations: Organization[];
  users: User[];
  projects: Project[];
  trades: ProjectTrade[];
  dependencies: TradeDependency[];
  procurements: ProcurementItem[];
  workLogs: WorkLog[];
  photos: WorkLogPhoto[];
  comments: TradeComment[];
  notifications: Notification[];
};

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Supabase 回傳格式不正確（${label}）`);
  }
  return value as Record<string, unknown>;
}

function rows(value: unknown, label: string): Record<string, unknown>[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`Supabase 回傳格式不正確（${label}）`);
  return value.map((item, index) => asRecord(item, `${label}[${index}]`));
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim() ? value : null;
}

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new Error(`Supabase 資料不正確（${label}：${String(value)}）`);
}

function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: asString(row.id),
    name: asString(row.name),
    createdAt: asString(row.createdAt),
  };
}

function mapUser(row: Record<string, unknown>): User {
  const email = asString(row.email);
  const stored = oneOf(row.roleDefault, ROLES, "roleDefault");
  return {
    id: asString(row.id),
    orgId: asString(row.orgId),
    email,
    name: asString(row.name),
    companyName: asString(row.companyName),
    phoneE164: asString(row.phoneE164),
    roleDefault: email.toLowerCase() === ADMIN_EMAIL ? "admin" : stored,
    passwordHash: asString(row.passwordHash),
    createdAt: asString(row.createdAt),
  };
}

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: asString(row.id),
    orgId: asString(row.orgId),
    name: asString(row.name),
    location: asString(row.location),
    clientDisplayName: asString(row.clientDisplayName),
    status: oneOf(row.status, PROJECT_STATUSES, "project.status"),
    plannedStart: asString(row.plannedStart),
    plannedEnd: asString(row.plannedEnd),
    notes: asString(row.notes),
    createdAt: asString(row.createdAt),
    updatedAt: asString(row.updatedAt),
  };
}

function mapTrade(row: Record<string, unknown>): ProjectTrade {
  return {
    id: asString(row.id),
    projectId: asString(row.projectId),
    name: asString(row.name),
    assigneeUserId: nullableString(row.assigneeUserId),
    status: oneOf(row.status, TRADE_STATUSES, "trade.status"),
    plannedStart: asString(row.plannedStart),
    plannedEnd: asString(row.plannedEnd),
    actualStart: nullableString(row.actualStart),
    actualEnd: nullableString(row.actualEnd),
    sortOrder: asNumber(row.sortOrder, 0),
    notes: asString(row.notes),
  };
}

function mapDependency(row: Record<string, unknown>): TradeDependency {
  return {
    id: asString(row.id),
    projectId: asString(row.projectId),
    tradeId: asString(row.tradeId),
    dependsOnTradeId: asString(row.dependsOnTradeId),
    requiredStatus: oneOf(row.requiredStatus, TRADE_STATUSES, "dependency.requiredStatus"),
  };
}

function mapProcurement(row: Record<string, unknown>): ProcurementItem {
  return {
    id: asString(row.id),
    projectId: asString(row.projectId),
    tradeId: nullableString(row.tradeId),
    name: asString(row.name),
    qty: asNumber(row.qty, 1),
    unit: asString(row.unit, "件"),
    status: oneOf(row.status, PROCUREMENT_STATUSES, "procurement.status"),
    supplierNote: asString(row.supplierNote),
    updatedAt: asString(row.updatedAt),
  };
}

function mapWorkLog(row: Record<string, unknown>): WorkLog {
  return {
    id: asString(row.id),
    projectTradeId: asString(row.projectTradeId),
    authorUserId: asString(row.authorUserId),
    body: asString(row.body),
    createdAt: asString(row.createdAt),
  };
}

function mapPhoto(row: Record<string, unknown>): WorkLogPhoto {
  return {
    id: asString(row.id),
    workLogId: asString(row.workLogId),
    url: asString(row.url),
    width: asNumber(row.width, 0),
    height: asNumber(row.height, 0),
    createdAt: asString(row.createdAt),
  };
}

function mapComment(row: Record<string, unknown>): TradeComment {
  return {
    id: asString(row.id),
    projectTradeId: asString(row.projectTradeId),
    authorUserId: asString(row.authorUserId),
    body: asString(row.body),
    createdAt: asString(row.createdAt),
  };
}

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: asString(row.id),
    userId: asString(row.userId),
    type: oneOf(row.type, NOTIFICATION_TYPES, "notification.type"),
    title: asString(row.title),
    body: asString(row.body),
    entityType: asString(row.entityType),
    entityId: asString(row.entityId),
    href: asString(row.href),
    readAt: nullableString(row.readAt),
    createdAt: asString(row.createdAt),
  };
}

export function toSupabasePayload(data: AppData): SupabasePayload {
  return {
    organizations: data.organizations,
    // Databases created before the admin role reject role "admin" until
    // schema.sql is applied. Keep that account as owner in the column and
    // promote it by email on read, so a save cannot fail the check.
    users: data.users.map((user) =>
      user.roleDefault === "admin" ? { ...user, roleDefault: "owner" as const } : user,
    ),
    projects: data.projects,
    trades: data.trades,
    dependencies: data.dependencies,
    procurements: data.procurements,
    workLogs: data.workLogs,
    photos: data.photos,
    comments: data.comments,
    notifications: data.notifications,
  };
}

export function fromSupabasePayload(raw: unknown): { data: AppData; revision: number } {
  let value = raw;
  if (typeof value === "string") {
    value = JSON.parse(value) as unknown;
  }
  const row = asRecord(value, "root");
  const revision = asNumber(row.revision, 0);
  const data: AppData = {
    version: 2,
    organizations: rows(row.organizations, "organizations").map(mapOrganization),
    users: rows(row.users, "users").map(mapUser),
    projects: rows(row.projects, "projects").map(mapProject),
    trades: rows(row.trades, "trades").map(mapTrade),
    dependencies: rows(row.dependencies, "dependencies").map(mapDependency),
    procurements: rows(row.procurements, "procurements").map(mapProcurement),
    workLogs: rows(row.workLogs, "workLogs").map(mapWorkLog),
    photos: rows(row.photos, "photos").map(mapPhoto),
    comments: rows(row.comments, "comments").map(mapComment),
    notifications: rows(row.notifications, "notifications").map(mapNotification),
  };
  return { data, revision };
}
