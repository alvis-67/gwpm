"use client";

import { useActionState } from "react";
import { createPartnerAction } from "@/actions/partners";

export function CreatePartnerForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(
    async (_previous: { error?: string } | null, formData: FormData) => {
      return (await createPartnerAction(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className={className}>
      {state?.error ? (
        <p className="text-sm mb-3" style={{ color: "var(--color-danger)" }}>
          {state.error}
        </p>
      ) : null}
      {children}
    </form>
  );
}
