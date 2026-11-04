"use client";

import { useActionState, useState } from "react";
import { assignTradeAction } from "@/actions/projects";
import { SubmitButton } from "@/components/SubmitButton";

export function AssignLeadForm({ tradeId }: { tradeId: string }) {
  const [query, setQuery] = useState("");
  const [state, action] = useActionState(assignTradeAction, null);
  const shown = state?.matchLabel && state.query === query.trim() ? state.matchLabel : null;

  return (
    <form action={action} className="mb-4">
      <input type="hidden" name="tradeId" value={tradeId} />
      <div className="field">
        <label htmlFor="assigneeQuery">電郵或電話</label>
        <input
          id="assigneeQuery"
          name="query"
          value={query}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {state?.error ? (
        <p className="text-sm mb-3" style={{ color: "var(--color-danger)" }}>
          {state.error}
        </p>
      ) : null}
      {shown ? <p className="mb-3">負責人：{shown}</p> : null}
      <div className="flex gap-2">
        <SubmitButton label="查詢" className="btn btn-secondary" />
        {shown ? (
          <SubmitButton name="intent" value="save" label="儲存指派" className="btn btn-primary" />
        ) : null}
      </div>
    </form>
  );
}
