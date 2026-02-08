import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Project, Task } from "@/types/database";
import { DashboardCharts } from "./dashboard-charts";
import { WalkthroughChecklist } from "@/components/walkthrough-checklist";

async function getProject(id: string): Promise<Project | null> {
  const { data } = await supabase.from("projects").select("*").eq("id", id).single();
  return data;
}

async function getTasks(projectId: string): Promise<Task[]> {
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });
  return data ?? [];
}

async function getFirstProjectId(): Promise<string | null> {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .order("name")
    .limit(1)
    .single();
  return data?.id ?? null;
}

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};
const priorityLabels: Record<string, string> = { high: "High", medium: "Medium", low: "Low" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectIdParam } = await searchParams;
  let projectId = projectIdParam ?? null;

  if (!projectId) {
    const firstId = await getFirstProjectId();
    if (firstId) redirect(`/?project=${firstId}`);
  }

  const [project, tasks] = await Promise.all([
    projectId ? getProject(projectId) : Promise.resolve(null),
    projectId ? getTasks(projectId) : Promise.resolve<Task[]>([]),
  ]);

  if (!projectId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#E8DCC8] bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-[#562F00]">Select a project</h2>
          <p className="mt-2 text-sm text-[#A08050]">
            Use the project selector in the top-right header to choose a project and view its
            dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#E8DCC8] bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-[#562F00]">Project not found</h2>
          <p className="mt-2 text-sm text-[#A08050]">
            Select another project from the header.
          </p>
        </div>
      </div>
    );
  }

  const completed = tasks.filter((t) => t.status === "completed");
  const blocked = tasks.filter((t) => t.status === "blocked");
  const completionPct =
    tasks.length === 0 ? 0 : Math.round((completed.length / tasks.length) * 100);
  const sorted = [...tasks].sort(
    (a, b) =>
      (priorityOrder[a.priority ?? "medium"] ?? 1) - (priorityOrder[b.priority ?? "medium"] ?? 1)
  );

  return (
    <div className="min-h-full">
      <div className="border-b border-[#E8DCC8] bg-[#FFFDF1] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-[#562F00]">Home</h1>
          <div className="flex gap-2">
            <Link
              href={`/project/${projectId}/blueprint`}
              className="rounded-lg border border-[#E8DCC8] px-4 py-2 text-sm font-medium text-[#562F00] hover:bg-[#FFF5EB]"
            >
              Blueprint
            </Link>
            <Link
              href={`/project/${projectId}/reports`}
              className="rounded-lg border border-[#E8DCC8] px-4 py-2 text-sm font-medium text-[#562F00] hover:bg-[#FFF5EB]"
            >
              Reports
            </Link>
            <Link
              href={`/project/${projectId}/task/new`}
              className="rounded-lg bg-[#FF9644] px-4 py-2 text-sm font-medium text-white hover:bg-[#e0853a]"
            >
              + Add task
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <WalkthroughChecklist projectId={projectId} />
        {/* Top 3 KPI cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E8DCC8] bg-white p-5">
            <p className="text-sm font-medium text-[#A08050]">Total tasks</p>
            <p className="mt-1 text-2xl font-bold text-[#562F00]">{tasks.length}</p>
          </div>
          <div className="rounded-xl border border-[#E8DCC8] bg-white p-5">
            <p className="text-sm font-medium text-[#A08050]">Completion rate</p>
            <p className="mt-1 text-2xl font-bold text-[#562F00]">{completionPct}%</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8DCC8]">
              <div
                className="h-full rounded-full bg-[#4CAF50]"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-[#E8DCC8] bg-white p-5">
            <p className="text-sm font-medium text-[#A08050]">Blockers</p>
            <p className="mt-1 text-2xl font-bold text-[#562F00]">{blocked.length}</p>
          </div>
        </div>

        {/* Pie + Bar charts */}
        <div className="mb-8">
          <DashboardCharts tasks={tasks} />
        </div>

        {/* Task pipeline */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-[#562F00]">Task pipeline</h2>
          <div className="rounded-xl border border-[#E8DCC8] bg-white overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8DCC8] bg-[#FFFDF1]">
                  <th className="px-4 py-3 font-semibold text-[#562F00]">Task</th>
                  <th className="px-4 py-3 font-semibold text-[#562F00]">Location</th>
                  <th className="px-4 py-3 font-semibold text-[#562F00]">Priority</th>
                  <th className="px-4 py-3 font-semibold text-[#562F00]">Status</th>
                  <th className="px-4 py-3 font-semibold text-[#562F00]">Due</th>
                  <th className="px-4 py-3 font-semibold text-[#562F00]">Proof</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-[#E8DCC8] last:border-0 hover:bg-[#FFF5EB]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/project/${projectId}/task/${task.id}`}
                        className="font-medium text-[#562F00] hover:text-[#FF9644]"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#8B6914]">{task.location ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "low"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {priorityLabels[task.priority ?? "medium"]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "blocked"
                              ? "bg-red-100 text-red-800"
                              : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {statusLabels[task.status ?? "pending"]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8B6914]">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/project/${projectId}/task/${task.id}#proof`}
                        className="text-[#FF9644] hover:underline"
                      >
                        View proof
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <div className="px-4 py-8 text-center text-[#A08050]">
                No tasks yet. Add a task to get started.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
