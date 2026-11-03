"use client";

import { useEffect } from "react";
import { TRADE_STATUSES, type TradeStatus } from "@/lib/types";
import { tradeStatusLabel } from "@/lib/labels";

export function StatusSheet({
  open,
  current,
  onClose,
  onSelect,
}: {
  open: boolean;
  current: TradeStatus;
  onClose: () => void;
  onSelect: (status: TradeStatus) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="關閉"
        onClick={onClose}
      />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="變更狀態">
        <h2 className="page-title" style={{ fontSize: "var(--text-lg)" }}>
          變更狀態
        </h2>
        <p className="secondary text-sm mb-3">選擇標準狀態後即寫入系統</p>
        <div className="list" style={{ borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {TRADE_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className="list-row w-full text-left"
              onClick={() => onSelect(status)}
            >
              <span className={`status-chip status-${status}`}>
                <span className="dot" aria-hidden />
                {tradeStatusLabel[status]}
              </span>
              {status === current && (
                <span className="text-sm" style={{ color: "var(--color-brand)" }}>
                  目前
                </span>
              )}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-secondary btn-block mt-4" onClick={onClose}>
          取消
        </button>
      </div>
    </>
  );
}
