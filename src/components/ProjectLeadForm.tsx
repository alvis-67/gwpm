"use client";

import { useState } from "react";
import { setProjectLeadAction } from "@/actions/projects";
import { SubmitButton } from "@/components/SubmitButton";

export function ProjectLeadForm({
  projectId,
  projectName,
  leadUserId,
  leads,
}: {
  projectId: string;
  projectName: string;
  leadUserId: string;
  leads: { id: string; label: string }[];
}) {
  const saved = leadUserId || "";
  const [value, setValue] = useState(saved);
  const [fromServer, setFromServer] = useState(saved);
  if (saved !== fromServer) {
    setFromServer(saved);
    setValue(saved);
  }
  const selectId = `lead-${projectId}`;

  return (
    <form action={setProjectLeadAction} className="mb-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="leadUserId" value={value} />
      <div className="field">
        <label htmlFor={selectId}>{projectName}</label>
        {/* Not owned by the action form, so form.reset() cannot snap the choice back to 未指派. */}
        <select
          id={selectId}
          form={`lead-display-${projectId}`}
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
      <SubmitButton label="儲存" className="btn btn-secondary" />
    </form>
  );
}
