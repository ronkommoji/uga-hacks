import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Project, Task } from "@/types/database";
import type { Room, Pin } from "@/types/blueprint";
import { BlueprintWorkspace } from "@/components/blueprint/BlueprintWorkspace";

async function getProject(id: string): Promise<Project | null> {
  const { data } = await supabase.from("projects").select("*").eq("id", id).single();
  return data;
}

async function getBlueprintFilePath(blueprintFileId: string | null): Promise<string | null> {
  if (!blueprintFileId) return null;
  const { data } = await supabase
    .from("project_files")
    .select("file_path")
    .eq("id", blueprintFileId)
    .single();
  return data?.file_path ?? null;
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

async function getBlueprintRooms(projectId: string): Promise<Room[]> {
  const { data } = await supabase
    .from("project_blueprint_rooms")
    .select("id, name, points")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    points: (r.points as { x: number; y: number }[]) ?? [],
  }));
}

async function getBlueprintPins(projectId: string): Promise<Pin[]> {
  const { data } = await supabase
    .from("project_blueprint_pins")
    .select("id, task_id, room_id, x, y")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (!data) return [];
  return data.map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    taskId: p.task_id,
    roomId: p.room_id,
  }));
}

export default async function BlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [tasks, blueprintFilePath, initialRooms, initialPins] = await Promise.all([
    getTasks(id),
    getBlueprintFilePath(project.blueprint_file_id),
    getBlueprintRooms(id),
    getBlueprintPins(id),
  ]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <BlueprintWorkspace
        projectId={id}
        projectName={project.name}
        tasks={tasks}
        initialBlueprintFilePath={blueprintFilePath}
        initialRooms={initialRooms}
        initialPins={initialPins}
      />
    </div>
  );
}
