"use client";

import { useState } from "react";
import { assignTradeAction } from "@/actions/projects";
import { SubmitButton } from "@/components/SubmitButton";

export function AssignLeadForm({
  tradeId,
  assigneeUserId,
  leads,
}: {
  tradeId: string;
  assigneeUserId: string | null;
  leads: { id: string; label: string }[];
}) {
  const saved = assigneeUserId || "";
  const [value, setValue] = useState(saved);
  const [fromServer, setFromServer] = useState(saved);
  if (saved !== fromServer) {
    setFromServer(saved);
    setValue(saved);
  }

  return (
    <form action={assignTradeAction} className="mb-4">
      <input type="hidden" name="tradeId" value={tradeId} />
      <input type="hidden" name="assigneeUserId" value={value} />
      <div className="field">
        <label htmlFor="assigneeUserId">工程公司｜負責人</label>
        {/* This select is not owned by the action form, so form.reset() cannot snap it back to 未指派. */}
        <select
          id="assigneeUserId"
          form="gwpm-assignee-display"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        >
          <option value="">未指派</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.label}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton label="儲存指派" className="btn btn-secondary" />
    </form>
  );
}
