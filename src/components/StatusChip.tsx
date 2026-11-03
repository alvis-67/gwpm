import {
  procurementStatusLabel,
  projectStatusLabel,
  tradeStatusLabel,
} from "@/lib/labels";
import type {
  ProcurementStatus,
  ProjectStatus,
  TradeStatus,
} from "@/lib/types";

export function TradeStatusChip({ status }: { status: TradeStatus }) {
  return (
    <span className={`status-chip status-${status}`}>
      <span className="dot" aria-hidden />
      {tradeStatusLabel[status]}
    </span>
  );
}

export function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  return (
    <span className={`status-chip status-${status}`}>
      <span className="dot" aria-hidden />
      {projectStatusLabel[status]}
    </span>
  );
}

export function ProcurementStatusChip({ status }: { status: ProcurementStatus }) {
  return (
    <span className={`status-chip proc-${status}`}>
      <span className="dot" aria-hidden />
      {procurementStatusLabel[status]}
    </span>
  );
}
