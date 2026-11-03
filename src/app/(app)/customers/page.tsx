import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { customerPath, splitProjectNotes } from "@/lib/project-docs";
import { visibleCustomerProjects } from "@/lib/permissions";
import { readData } from "@/lib/store";

export default async function CustomersPage() {
  const user = await requireSession();
  const data = await readData();
  const projects = visibleCustomerProjects(data, user);
  const counts = new Map<string, number>();
  for (const project of projects) {
    const name = project.clientDisplayName.trim();
    const docs = splitProjectNotes(project.notes);
    const rows = Number(Boolean(docs.quotationNumber)) + Number(Boolean(docs.invoiceNumber));
    counts.set(name, (counts.get(name) || 0) + rows);
  }
  const customers = [...counts.entries()].sort((a, b) =>
    (a[0] || "未填客戶").localeCompare(b[0] || "未填客戶", "zh-Hant"),
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">客戶</h1>
      </header>
      {customers.length === 0 ? (
        <div className="empty">尚無客戶</div>
      ) : (
        <div className="list">
          {customers.map(([name, count]) => (
            <Link key={name || "_"} href={customerPath(name)} className="list-row">
              <div className="list-row-main">
                <h2 className="list-row-title">{name || "未填客戶"}</h2>
                <p className="secondary text-sm mb-0">報價及發票 {count} 筆</p>
              </div>
              <span className="muted">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
