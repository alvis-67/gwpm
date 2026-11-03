import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { customerNameFromPath, customerPath, splitProjectNotes } from "@/lib/project-docs";
import { visibleProjects } from "@/lib/permissions";
import { readData } from "@/lib/store";

interface DocRow {
  kind: "報價" | "發票";
  number: string;
  location: string;
  projectName: string;
  projectId: string;
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { name: rawName } = await params;
  const sp = await searchParams;
  const customerName = customerNameFromPath(rawName);
  const user = await requireSession();
  const data = await readData();
  const projects = visibleProjects(data, user).filter(
    (project) => project.clientDisplayName.trim() === customerName,
  );
  if (projects.length === 0) notFound();

  const rows: DocRow[] = [];
  for (const project of projects) {
    const docs = splitProjectNotes(project.notes);
    if (docs.quotationNumber) {
      rows.push({
        kind: "報價",
        number: docs.quotationNumber,
        location: project.location.trim(),
        projectName: project.name,
        projectId: project.id,
      });
    }
    if (docs.invoiceNumber) {
      rows.push({
        kind: "發票",
        number: docs.invoiceNumber,
        location: project.location.trim(),
        projectName: project.name,
        projectId: project.id,
      });
    }
  }

  const sorted = sp.sort === "location";
  const ordered = sorted
    ? [...rows].sort((a, b) => {
        const byLocation = (a.location || "￿").localeCompare(b.location || "￿", "zh-Hant");
        if (byLocation !== 0) return byLocation;
        return a.number.localeCompare(b.number, "zh-Hant");
      })
    : rows;
  const href = customerPath(customerName);

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href="/customers">客戶</Link>
      </p>
      <header className="page-header">
        <h1 className="page-title">{customerName || "未填客戶"}</h1>
        <Link href={sorted ? href : `${href}?sort=location`} className="btn btn-secondary">
          {sorted ? "恢復原序" : "依工作地點排序"}
        </Link>
      </header>
      <p className="secondary text-sm mb-4">報價編號與發票編號</p>
      {ordered.length === 0 ? (
        <div className="empty">尚未填寫報價或發票編號。可在工程案編輯頁加入。</div>
      ) : (
        <div className="list">
          {ordered.map((row) => (
            <Link
              key={`${row.kind}-${row.projectId}-${row.number}`}
              href={`/projects/${row.projectId}`}
              className="list-row"
            >
              <div className="list-row-main">
                <h2 className="list-row-title">
                  {row.kind} {row.number}
                </h2>
                <div className="list-row-meta">
                  <span>工作地點：{row.location || "未填"}</span>
                  <span>{row.projectName}</span>
                </div>
              </div>
              <span className="muted">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
