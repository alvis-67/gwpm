export type Role = "owner" | "trade_lead";

export type ProjectStatus = "planning" | "active" | "completed" | "archived";

export type TradeStatus =
  | "not_started"
  | "ready"
  | "in_progress"
  | "pending_accept"
  | "completed"
  | "paused"
  | "blocked";

export type ProcurementStatus = "todo" | "ordered" | "received" | "shortage";

export type NotificationType =
  | "assigned"
  | "tomorrow_entry"
  | "status_change"
  | "comment"
  | "procurement"
  | "dependency_ready";

/** 獨立工程公司租戶（各老闆互不相通） */
export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  orgId: string;
  email: string;
  name: string;
  /** 對負責人：分包公司名；對老闆：可與 org.name 相同或留空 */
  companyName: string;
  phoneE164: string;
  roleDefault: Role;
  passwordHash: string;
  createdAt: string;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  location: string;
  clientDisplayName: string;
  status: ProjectStatus;
  plannedStart: string;
  plannedEnd: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTrade {
  id: string;
  projectId: string;
  name: string;
  assigneeUserId: string | null;
  status: TradeStatus;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  sortOrder: number;
  notes: string;
}

export interface TradeDependency {
  id: string;
  projectId: string;
  tradeId: string;
  dependsOnTradeId: string;
  requiredStatus: TradeStatus;
}

export interface ProcurementItem {
  id: string;
  projectId: string;
  tradeId: string | null;
  name: string;
  qty: number;
  unit: string;
  status: ProcurementStatus;
  supplierNote: string;
  updatedAt: string;
}

export interface WorkLog {
  id: string;
  projectTradeId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface WorkLogPhoto {
  id: string;
  workLogId: string;
  url: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface TradeComment {
  id: string;
  projectTradeId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}

export interface AppData {
  version: 2;
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
}

export const DEFAULT_TRADE_TEMPLATES = [
  "清拆",
  "水電",
  "泥水",
  "油漆",
  "室內設計",
  "傢俱",
  "IT 系統",
  "門窗",
] as const;

export const TRADE_STATUSES: TradeStatus[] = [
  "not_started",
  "ready",
  "in_progress",
  "pending_accept",
  "completed",
  "paused",
  "blocked",
];

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "active",
  "completed",
  "archived",
];

export const PROCUREMENT_STATUSES: ProcurementStatus[] = [
  "todo",
  "ordered",
  "received",
  "shortage",
];
