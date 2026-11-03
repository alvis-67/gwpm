import { markAllNotificationsReadAction } from "@/actions/notifications";
import { NotificationRow } from "@/components/NotificationRow";
import { requireSession } from "@/lib/auth";
import { readData } from "@/lib/store";

export default async function NotificationsPage() {
  const user = await requireSession();
  const data = await readData();
  const items = data.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">通知</h1>
        <form action={markAllNotificationsReadAction}>
          <button type="submit" className="btn btn-tertiary">
            全部標為已讀
          </button>
        </form>
      </header>

      <div className="list">
        {items.length === 0 && <div className="empty">尚無通知</div>}
        {items.map((n) => (
          <NotificationRow
            key={n.id}
            id={n.id}
            title={n.title}
            body={n.body}
            href={n.href}
            createdAt={n.createdAt}
            readAt={n.readAt}
          />
        ))}
      </div>
    </div>
  );
}
