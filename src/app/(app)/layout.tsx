import { AppNav } from "@/components/AppNav";
import { requireSession } from "@/lib/auth";
import { unreadCount } from "@/lib/notifications";
import { readData } from "@/lib/store";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  const data = await readData();
  const unread = unreadCount(data, user.id);

  return (
    <div className="app-shell">
      <AppNav unread={unread} />
      <div className="app-main">{children}</div>
    </div>
  );
}
