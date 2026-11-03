import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateProjectAction } from "@/actions/projects";
import { canManageProjects, requireSession } from "@/lib/auth";
import { projectStatusLabel } from "@/lib/labels";
import { canAccessProject } from "@/lib/permissions";
import { splitProjectNotes } from "@/lib/project-docs";
import { readData } from "@/lib/store";
import { PROJECT_STATUSES } from "@/lib/types";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  if (!canManageProjects(user)) redirect(`/projects/${id}`);
  const data = await readData();
  if (!canAccessProject(data, user, id)) notFound();
  const project = data.projects.find((p) => p.id === id);
  if (!project) notFound();
  const docs = splitProjectNotes(project.notes);

  return (
    <div className="page">
      <p className="secondary text-sm mb-2">
        <Link href={`/projects/${id}`}>{project.name}</Link>
      </p>
      <h1 className="page-title mb-4">編輯工程案</h1>

      <form action={updateProjectAction}>
        <input type="hidden" name="projectId" value={id} />
        <div className="field">
          <label htmlFor="name">工程案名稱（必填）</label>
          <input id="name" name="name" required defaultValue={project.name} />
        </div>
        <div className="field">
          <label htmlFor="location">工作地點</label>
          <input id="location" name="location" defaultValue={project.location} />
        </div>
        <div className="field">
          <label htmlFor="clientDisplayName">客戶顯示名稱</label>
          <input
            id="clientDisplayName"
            name="clientDisplayName"
            defaultValue={project.clientDisplayName}
          />
        </div>
        <div className="field">
          <label htmlFor="status">工程狀態</label>
          <select id="status" name="status" defaultValue={project.status}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {projectStatusLabel[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="plannedStart">計劃開始</label>
          <input
            id="plannedStart"
            name="plannedStart"
            type="date"
            className="font-mono"
            defaultValue={project.plannedStart}
          />
        </div>
        <div className="field">
          <label htmlFor="plannedEnd">計劃完工</label>
          <input
            id="plannedEnd"
            name="plannedEnd"
            type="date"
            className="font-mono"
            defaultValue={project.plannedEnd}
          />
        </div>
        <div className="field">
          <label htmlFor="notes">備註</label>
          <textarea id="notes" name="notes" defaultValue={docs.text} />
        </div>
        <button type="submit" className="btn btn-primary btn-block md:max-w-xs">
          儲存
        </button>
      </form>
    </div>
  );
}
