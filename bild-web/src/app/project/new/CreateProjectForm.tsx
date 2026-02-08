"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: err } = await supabase
      .from("projects")
      .insert({ name, description: description || null, address: address || null })
      .select("id")
      .single();
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data?.id) router.push(`/?project=${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-[#E8DCC8] bg-white p-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[#562F00]">
          Project name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#E8DCC8] bg-white px-3 py-2 text-[#562F00] focus:border-[#FF9644] focus:outline-none focus:ring-1 focus:ring-[#FF9644]"
          placeholder="e.g. Main St Renovation"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-[#562F00]">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-[#E8DCC8] bg-white px-3 py-2 text-[#562F00] focus:border-[#FF9644] focus:outline-none focus:ring-1 focus:ring-[#FF9644]"
          placeholder="Brief description of the project"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-[#562F00]">
          Address
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#E8DCC8] bg-white px-3 py-2 text-[#562F00] focus:border-[#FF9644] focus:outline-none focus:ring-1 focus:ring-[#FF9644]"
          placeholder="Site address"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#FF9644] px-4 py-2.5 font-medium text-white hover:bg-[#e0853a] disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create project"}
        </button>
        <a
          href="/"
          className="rounded-lg border border-[#E8DCC8] px-4 py-2.5 font-medium text-[#562F00] hover:bg-[#FFF5EB]"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
