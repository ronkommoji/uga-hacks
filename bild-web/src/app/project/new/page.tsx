import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CreateProjectForm } from "./CreateProjectForm";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#E8DCC8] bg-[#FFFDF1] px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <Link href="/" className="text-[#562F00] hover:text-[#FF9644]">
            ← Projects
          </Link>
          <h1 className="text-xl font-bold text-[#562F00]">New project</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <CreateProjectForm />
      </main>
    </div>
  );
}
