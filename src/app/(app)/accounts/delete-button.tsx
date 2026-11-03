"use client";

import { deleteAccountAction } from "@/actions/accounts";
import { SubmitButton } from "@/components/SubmitButton";

export function DeleteAccountButton({ userId, name }: { userId: string; name: string }) {
  return (
    <form
      action={deleteAccountAction}
      onSubmit={(event) => {
        if (!window.confirm(`刪除「${name}」？此帳號將不能再登入。`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton label="刪除" className="btn btn-danger" />
    </form>
  );
}
