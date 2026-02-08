"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TaskProof, Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Loader2 } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};
const priorityLabels: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};
const statuses = ["pending", "in_progress", "blocked", "completed"] as const;
const priorities = ["high", "medium", "low"] as const;

type Props = {
  projectId: string;
  task: Task;
  proofs: TaskProof[];
};

export function TaskDetailClient({ projectId, task: initialTask, proofs }: Props) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Form state (when editing)
  const [title, setTitle] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description ?? "");
  const [location, setLocation] = useState(initialTask.location ?? "");
  const [dueDate, setDueDate] = useState(
    initialTask.due_date ? initialTask.due_date.slice(0, 10) : ""
  );
  const [status, setStatus] = useState(initialTask.status ?? "pending");
  const [priority, setPriority] = useState<"high" | "medium" | "low">(
    (initialTask.priority as "high" | "medium" | "low") ?? "medium"
  );
  const [blockedReason, setBlockedReason] = useState(initialTask.blocked_reason ?? "");
  const [assignedTo, setAssignedTo] = useState<string | null>(initialTask.assigned_to);

  useEffect(() => {
    setTask(initialTask);
    setTitle(initialTask.title);
    setDescription(initialTask.description ?? "");
    setLocation(initialTask.location ?? "");
    setDueDate(initialTask.due_date ? initialTask.due_date.slice(0, 10) : "");
    setStatus(initialTask.status ?? "pending");
    setPriority((initialTask.priority as "high" | "medium" | "low") ?? "medium");
    setBlockedReason(initialTask.blocked_reason ?? "");
    setAssignedTo(initialTask.assigned_to);
  }, [initialTask]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name")
      .then(({ data }) => setProfiles((data as Profile[]) ?? []));
  }, []);

  async function handleSave() {
    setError(null);
    setSaving(true);
    const { error: err } = await supabase
      .from("tasks")
      .update({
        title: title.trim() || task.title,
        description: description.trim() || null,
        location: location.trim() || null,
        due_date: dueDate || null,
        status,
        priority,
        blocked_reason: blockedReason.trim() || null,
        assigned_to: assignedTo || null,
        completed_at:
          status === "completed" ? new Date().toISOString() : task.completed_at ?? null,
      })
      .eq("id", task.id)
      .eq("project_id", projectId);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setLocation(task.location ?? "");
    setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    setStatus(task.status ?? "pending");
    setPriority((task.priority as "high" | "medium" | "low") ?? "medium");
    setBlockedReason(task.blocked_reason ?? "");
    setAssignedTo(task.assigned_to);
    setError(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-[#E8DCC8] bg-[#FFFDF1] px-6 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/?project=${projectId}`}
                className="text-[#562F00] hover:text-[#FF9644]"
              >
                ← Home
              </Link>
              <h1 className="text-lg font-bold text-[#562F00]">Edit task</h1>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-8">
          <div className="rounded-xl border border-[#E8DCC8] bg-white p-6 shadow-sm">
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Details for the field worker"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location / room</Label>
                <Input
                  id="edit-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Room 101"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as typeof statuses[number])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabels[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as "high" | "medium" | "low")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p} value={p}>
                          {priorityLabels[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-due">Due date</Label>
                  <Input
                    id="edit-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assign to</Label>
                  <Select
                    value={assignedTo ?? "unassigned"}
                    onValueChange={(v) => setAssignedTo(v === "unassigned" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-blocked">Blocked reason (if blocked)</Label>
                <textarea
                  id="edit-blocked"
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                  rows={2}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Why is this task blocked?"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                Save changes
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#E8DCC8] bg-[#FFFDF1] px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/?project=${projectId}`}
              className="text-[#562F00] hover:text-[#FF9644]"
            >
              ← Home
            </Link>
            <h1 className="text-lg font-bold text-[#562F00]">Task details</h1>
          </div>
          <Button size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5 mr-1.5" />
            Edit task
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              task.priority === "high"
                ? "bg-red-100 text-red-800"
                : task.priority === "low"
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
            }`}
          >
            {priorityLabels[task.priority ?? "medium"]} priority
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
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
        </div>

        <h2 className="text-2xl font-bold text-[#562F00]">{task.title}</h2>
        {task.location && (
          <p className="mt-2 flex items-center gap-1 text-[#8B6914]">📍 {task.location}</p>
        )}
        {task.description && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#A08050]">
              Description
            </h3>
            <p className="mt-1 text-[#562F00] whitespace-pre-wrap">{task.description}</p>
          </div>
        )}
        {task.due_date && (
          <p className="mt-2 text-sm text-[#A08050]">
            Due: {new Date(task.due_date).toLocaleDateString()}
          </p>
        )}
        {task.assigned_to && (
          <p className="mt-2 text-sm text-[#A08050]">
            Assigned to:{" "}
            {profiles.find((p) => p.id === task.assigned_to)?.full_name ?? task.assigned_to}
          </p>
        )}
        {task.blocked_reason && (
          <div className="mt-4 rounded-lg bg-red-50 p-4">
            <h3 className="text-sm font-semibold text-red-800">Blocked reason</h3>
            <p className="mt-1 text-red-700">{task.blocked_reason}</p>
          </div>
        )}

        <section id="proof" className="mt-10 scroll-mt-8">
          <h3 className="text-lg font-bold text-[#562F00]">
            Proof of work ({proofs.length} {proofs.length === 1 ? "submission" : "submissions"})
          </h3>
          {proofs.length === 0 ? (
            <p className="mt-2 text-[#A08050]">No proof submitted yet.</p>
          ) : (
            <div className="mt-4 space-y-6">
              {proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="rounded-xl border border-[#E8DCC8] bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap gap-4">
                    {proof.photo_url && (
                      <div className="relative h-48 w-64 overflow-hidden rounded-lg bg-[#E8DCC8]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proof.photo_url}
                          alt="Proof photo"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {proof.annotation_url && (
                      <div className="relative h-48 w-64 overflow-hidden rounded-lg bg-[#E8DCC8]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proof.annotation_url}
                          alt="Annotation"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  {proof.transcript && (
                    <div className="mt-3 flex gap-2 text-[#562F00]">
                      <span className="text-[#A08050]">🎤</span>
                      <p className="flex-1 italic">{proof.transcript}</p>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-[#A08050]">
                    {proof.created_at
                      ? new Date(proof.created_at).toLocaleString()
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
