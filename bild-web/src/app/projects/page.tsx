import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function getFirstProjectId(): Promise<string | null> {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .order("name")
    .limit(1)
    .single();
  return data?.id ?? null;
}

export default async function ProjectsPage() {
  const firstId = await getFirstProjectId();
  if (firstId) redirect(`/?project=${firstId}`);
  redirect("/");
}
