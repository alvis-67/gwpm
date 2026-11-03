"use client";

import { useRef, useState } from "react";
import { deleteTradeAction } from "@/actions/projects";
import { TradeStatusChip } from "@/components/StatusChip";
import type { TradeStatus } from "@/lib/types";

export function ProgressItem({
  href,
  title,
  status,
  assignee,
  date,
  blocked,
  tradeId,
  canRemove,
}: {
  href: string;
  title: string;
  status: TradeStatus;
  assignee: string;
  date: string;
  blocked: boolean;
  tradeId: string;
  canRemove: boolean;
}) {
  const startX = useRef<number | null>(null);
  const dxRef = useRef(0);
  const dragged = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [dx, setDx] = useState(0);

  function setOffset(next: number) {
    dxRef.current = next;
    setDx(next);
  }

  function askRemove() {
    if (!window.confirm(`向右移除此工程進度「${title}」？`)) return false;
    return window.confirm(`再次確認：刪除「${title}」後不能復原。`);
  }

  function submitRemove() {
    if (!askRemove()) {
      setOffset(0);
      return;
    }
    formRef.current?.requestSubmit();
  }

  return (
    <div className="list-row" style={{ position: "relative", overflow: "hidden", touchAction: "pan-y" }}>
      <form ref={formRef} action={deleteTradeAction} hidden>
        <input type="hidden" name="tradeId" value={tradeId} />
      </form>
      {canRemove && (
        <span
          aria-hidden
          className="text-sm"
          style={{ position: "absolute", left: 16, color: "var(--color-danger)" }}
        >
          鬆開以移除
        </span>
      )}
      <div
        className="flex items-center gap-2 w-full"
        style={{
          transform: `translateX(${dx}px)`,
          background: "var(--color-surface)",
          transition: startX.current == null ? "transform 160ms ease" : undefined,
        }}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (!canRemove || (event.target as HTMLElement).closest("button")) return;
          startX.current = event.clientX;
          const move = (ev: PointerEvent) => {
            if (startX.current == null) return;
            const next = Math.max(0, Math.min(112, ev.clientX - startX.current));
            if (next > 8) dragged.current = true;
            setOffset(next);
          };
          const end = (ev: PointerEvent) => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", end);
            window.removeEventListener("pointercancel", end);
            if (startX.current == null) return;
            const moved = dxRef.current;
            startX.current = null;
            if (moved > 8) {
              dragged.current = true;
              window.setTimeout(() => {
                dragged.current = false;
              }, 600);
            }
            if (ev.type === "pointercancel" || moved <= 72) setOffset(0);
            else submitRemove();
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", end);
          window.addEventListener("pointercancel", end);
        }}
      >
        <a
          href={href}
          draggable={false}
          className="list-row-main"
          onClick={(event) => {
            if (dragged.current || dxRef.current > 8) {
              event.preventDefault();
              dragged.current = false;
            }
          }}
        >
          <h3 className="list-row-title">{title}</h3>
          <div className="list-row-meta">
            <TradeStatusChip status={status} />
            <span>{assignee}</span>
            <span className="font-mono">{date}</span>
            {blocked && <span style={{ color: "var(--color-danger)" }}>受阻</span>}
          </div>
        </a>
        {canRemove && (
          <button type="button" className="btn btn-danger" onClick={submitRemove}>
            移除
          </button>
        )}
      </div>
    </div>
  );
}
