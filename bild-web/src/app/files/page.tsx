import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types/database";
import { FilesView } from "../files-view";

async function getFirstProjectId(): Promise<string | null> {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .order("name")
    .limit(1)
    .single();
  return data?.id ?? null;
}

async function getProjectName(id: string): Promise<string | null> {
  const { data } = await supabase.from("projects").select("name").eq("id", id).single();
  return data?.name ?? null;
}

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectId } = await searchParams;

  if (!projectId) {
    const firstId = await getFirstProjectId();
    if (firstId) redirect(`/files?project=${firstId}`);
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#E8DCC8] bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-[#562F00]">Select a project</h2>
          <p className="mt-2 text-sm text-[#A08050]">
            Use the project selector in the top-right header to choose a project.
          </p>
        </div>
      </div>
    );
  }

  const projectName = await getProjectName(projectId);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Files</h1>
        <p className="text-muted-foreground">
          {projectName
            ? `Upload and manage files for ${projectName}.`
            : "Upload and manage project documentation."}
        </p>
      </div>
      <FilesView projectId={projectId} projectName={projectName ?? "Project"} />
    </div>
  );
}
