"use client";

import { SubmitButton } from "@/components/SubmitButton";

export function ConfirmTwiceButton({
  action,
  fields,
  label,
  first,
  second,
  className = "btn btn-danger",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  first: string;
  second: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(first)) {
          event.preventDefault();
          return;
        }
        if (!window.confirm(second)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton label={label} className={className} />
    </form>
  );
}
