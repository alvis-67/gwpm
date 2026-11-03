import type {
  ProcurementStatus,
  ProjectStatus,
  Role,
  TradeStatus,
} from "./types";

export const roleLabel: Record<Role, string> = {
  admin: "系統管理員",
  owner: "工程公司老闆",
  trade_lead: "項目成員",
};

export const PRODUCT_NAME = "Gwpm";
export const PRODUCT_FULL = "Goodwill Project Management System";
export const PRODUCT_TAGLINE = "統籌分包進場、進度與現場日誌";

export const projectStatusLabel: Record<ProjectStatus, string> = {
  planning: "籌備中",
  active: "進行中",
  completed: "已完工",
  archived: "已封存",
};

export const tradeStatusLabel: Record<TradeStatus, string> = {
  not_started: "未開始",
  ready: "待進場",
  in_progress: "進行中",
  pending_accept: "待驗收",
  completed: "已完成",
  paused: "暫停",
  blocked: "受阻",
};

export const procurementStatusLabel: Record<ProcurementStatus, string> = {
  todo: "待訂",
  ordered: "已訂",
  received: "已到",
  shortage: "缺料",
};

export const navItems = [
  { href: "/projects", label: "工程", icon: "projects" },
  { href: "/today", label: "今日", icon: "today" },
  { href: "/notifications", label: "通知", icon: "notifications" },
  { href: "/me", label: "我的", icon: "me" },
] as const;
