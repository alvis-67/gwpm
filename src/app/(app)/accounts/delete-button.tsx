"use client";

import { deleteAccountAction } from "@/actions/accounts";

export function DeleteAccountButton({ userId, name }: { userId: string; name: string }) {
  return (
    <form action={deleteAccountAction}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="btn btn-danger"
        onClick={(event) => {
          if (!window.confirm(`刪除「${name}」？此帳號將不能再登入。`)) {
            event.preventDefault();
          }
        }}
      >
        刪除
      </button>
    </form>
  );
}
