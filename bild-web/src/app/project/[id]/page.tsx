import { redirect, notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function getProjectExists(id: string): Promise<boolean> {
  const { data } = await supabase.from("projects").select("id").eq("id", id).single();
  return !!data;
}

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exists = await getProjectExists(id);
  if (!exists) notFound();
  redirect(`/?project=${id}`);
}
