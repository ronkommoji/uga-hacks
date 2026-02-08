import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types/database";
import { CreateTaskForm } from "./CreateTaskForm";

async function getProject(id: string): Promise<Project | null> {
  const { data } = await supabase.from("projects").select("*").eq("id", id).single();
  return data;
}

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#E8DCC8] bg-[#FFFDF1] px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <Link href={`/?project=${id}`} className="text-[#562F00] hover:text-[#FF9644]">
            ← Home
          </Link>
          <h1 className="text-xl font-bold text-[#562F00]">New task</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <CreateTaskForm projectId={id} />
      </main>
    </div>
  );
}
