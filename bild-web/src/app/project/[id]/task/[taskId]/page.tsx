import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Task, TaskProof } from "@/types/database";
import { TaskDetailClient } from "./TaskDetailClient";

async function getTask(projectId: string, taskId: string): Promise<Task | null> {
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .single();
  return data;
}

async function getProofs(taskId: string): Promise<TaskProof[]> {
  const { data } = await supabase
    .from("task_proofs")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id: projectId, taskId } = await params;
  const task = await getTask(projectId, taskId);
  if (!task) notFound();

  const proofs = await getProofs(taskId);

  return (
    <TaskDetailClient
      projectId={projectId}
      task={task}
      proofs={proofs}
    />
  );
}
