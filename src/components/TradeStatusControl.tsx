"use client";

import { useState, useTransition } from "react";
import { StatusSheet } from "@/components/StatusSheet";
import { TradeStatusChip } from "@/components/StatusChip";
import { updateTradeStatusAction } from "@/actions/trades";
import type { TradeStatus } from "@/lib/types";

export function TradeStatusControl({
  tradeId,
  status,
  canEdit,
}: {
  tradeId: string;
  status: TradeStatus;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <TradeStatusChip status={status} />
        {canEdit && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending}
            onClick={() => setOpen(true)}
          >
            {pending ? "更新中…" : "變更狀態"}
          </button>
        )}
      </div>
      <StatusSheet
        open={open}
        current={status}
        onClose={() => setOpen(false)}
        onSelect={(next) => {
          setOpen(false);
          startTransition(async () => {
            await updateTradeStatusAction(tradeId, next);
          });
        }}
      />
    </>
  );
}
