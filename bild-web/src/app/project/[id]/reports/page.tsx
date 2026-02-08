import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Project, Task, ActivityFeedItem } from "@/types/database";
import { ReportExport } from "./ReportExport";

async function getProject(id: string): Promise<Project | null> {
  const { data } = await supabase.from("projects").select("*").eq("id", id).single();
  return data;
}

async function getTasks(projectId: string): Promise<Task[]> {
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

async function getActivity(projectId: string, since: string): Promise<ActivityFeedItem[]> {
  const { data } = await supabase
    .from("activity_feed")
    .select("*")
    .eq("project_id", projectId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  return data ?? [];
}

const actionLabels: Record<string, string> = {
  task_completed: "Task completed",
  task_blocked: "Task blocked",
  task_started: "Task started",
  proof_submitted: "Proof submitted",
  message_sent: "Message sent",
  member_joined: "Member joined",
};

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { id } = await params;
  const { period = "7" } = await searchParams;
  const project = await getProject(id);
  if (!project) notFound();

  const days = Math.min(90, Math.max(1, parseInt(period, 10) || 7));
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const [tasks, activity] = await Promise.all([
    getTasks(id),
    getActivity(id, sinceStr),
  ]);

  const completed = tasks.filter((t) => t.status === "completed");
  const completedInPeriod = completed.filter(
    (t) => t.completed_at && t.completed_at >= sinceStr
  );
  const blocked = tasks.filter((t) => t.status === "blocked");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#E8DCC8] bg-[#FFFDF1] px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/?project=${id}`} className="text-[#562F00] hover:text-[#FF9644]">
              ← Home
            </Link>
            <h1 className="text-xl font-bold text-[#562F00]">Reports</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="text-sm text-[#A08050]">
            Last {days} day{days !== 1 ? "s" : ""}
          </span>
          <ReportExport
            projectId={id}
            projectName={project.name}
            tasks={tasks}
            activity={activity}
            since={sinceStr}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-[#E8DCC8] bg-white p-5">
            <h2 className="font-semibold text-[#562F00]">Summary</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#562F00]">
              <li>Total tasks: {tasks.length}</li>
              <li>Completed (all time): {completed.length}</li>
              <li>Completed in period: {completedInPeriod.length}</li>
              <li>Blocked: {blocked.length}</li>
              <li>Activity events: {activity.length}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[#E8DCC8] bg-white p-5">
            <h2 className="font-semibold text-[#562F00]">Recent activity</h2>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {activity.slice(0, 20).map((item) => (
                <li key={item.id} className="flex justify-between gap-2 text-[#562F00]">
                  <span>{actionLabels[item.action] ?? item.action}</span>
                  <span className="shrink-0 text-[#A08050]">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : ""}
                  </span>
                </li>
              ))}
              {activity.length === 0 && (
                <li className="text-[#A08050]">No activity in this period.</li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
