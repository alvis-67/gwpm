"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markNotificationReadAction } from "@/actions/notifications";
import { formatDateTimeZh } from "@/lib/dates";

export function NotificationRow({
  id,
  title,
  body,
  href,
  createdAt,
  readAt,
}: {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  readAt: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Link
      href={href}
      className="list-row"
      onClick={() => {
        if (!readAt) {
          startTransition(async () => {
            await markNotificationReadAction(id);
          });
        }
      }}
      aria-busy={pending}
    >
      <div className="list-row-main">
        <h2 className="list-row-title" style={{ fontWeight: readAt ? 400 : 700 }}>
          {title}
        </h2>
        <p className="secondary text-sm mb-1">{body}</p>
        <p className="muted text-xs font-mono mb-0">{formatDateTimeZh(createdAt)}</p>
      </div>
      <span className="muted">›</span>
    </Link>
  );
}
