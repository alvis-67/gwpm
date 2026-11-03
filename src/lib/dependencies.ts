import type { AppData, ProjectTrade, TradeStatus } from "./types";
import { tradeStatusLabel } from "./labels";

const STATUS_RANK: Record<TradeStatus, number> = {
  not_started: 0,
  ready: 1,
  in_progress: 2,
  pending_accept: 3,
  completed: 4,
  paused: 1,
  blocked: 0,
};

function meetsRequired(current: TradeStatus, required: TradeStatus): boolean {
  if (required === "completed") return current === "completed";
  return STATUS_RANK[current] >= STATUS_RANK[required];
}

export type DependencyHint =
  | { kind: "ready" }
  | {
      kind: "blocked";
      blockers: { name: string; requiredStatus: TradeStatus; requiredLabel: string }[];
    }
  | { kind: "none" };

export function evaluateDependency(
  data: AppData,
  trade: ProjectTrade,
): DependencyHint {
  const deps = data.dependencies.filter((d) => d.tradeId === trade.id);
  if (deps.length === 0) return { kind: "none" };

  const blockers: {
    name: string;
    requiredStatus: TradeStatus;
    requiredLabel: string;
  }[] = [];

  for (const dep of deps) {
    const upstream = data.trades.find((t) => t.id === dep.dependsOnTradeId);
    if (!upstream) continue;
    if (!meetsRequired(upstream.status, dep.requiredStatus)) {
      blockers.push({
        name: upstream.name,
        requiredStatus: dep.requiredStatus,
        requiredLabel: tradeStatusLabel[dep.requiredStatus],
      });
    }
  }

  if (blockers.length > 0) return { kind: "blocked", blockers };
  return { kind: "ready" };
}

export function projectBlockedTrades(data: AppData, projectId: string) {
  return data.trades
    .filter((t) => t.projectId === projectId)
    .map((t) => ({ trade: t, hint: evaluateDependency(data, t) }))
    .filter((x) => x.hint.kind === "blocked");
}
