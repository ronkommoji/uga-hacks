"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Task } from "@/types/database";
import type { Pin } from "@/types/blueprint";
import { supabase } from "@/lib/supabase";
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
import { Pencil, Trash2 } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

const statuses = ["pending", "in_progress", "blocked", "completed"] as const;
const priorities = ["high", "medium", "low"] as const;

type Props = {
  projectId: string;
  pin: Pin | null;
  tasks: Task[];
  open: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onLinkTask: (pinId: string, taskId: string) => void;
  onDeletePin?: (pinId: string) => void;
  onTaskUpdated?: (task: Task) => void;
};

export function TaskModal({
  projectId,
  pin,
  tasks,
  open,
  position,
  onClose,
  onLinkTask,
  onDeletePin,
  onTaskUpdated,
}: Props) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">("medium");
  const [editStatus, setEditStatus] = useState<string>("pending");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedTask = pin ? tasks.find((t) => t.id === pin.taskId) : null;

  useEffect(() => {
    if (pin) setSelectedTaskId(pin.taskId);
    else setSelectedTaskId("");
  }, [pin, open]);

  useEffect(() => {
    if (linkedTask && editing) {
      setEditTitle(linkedTask.title ?? "");
      setEditDescription(linkedTask.description ?? "");
      setEditLocation(linkedTask.location ?? "");
      setEditPriority((linkedTask.priority as "high" | "medium" | "low") ?? "medium");
      setEditStatus(linkedTask.status ?? "pending");
    }
  }, [linkedTask, editing]);

  if (!open || !pin) return null;

  const modalWidth = 320;
  const x = Math.min(
    Math.max(20, position.x - modalWidth / 2),
    typeof window !== "undefined" ? window.innerWidth - modalWidth - 20 : position.x
  );
  const y = Math.min(
    Math.max(20, position.y - 80),
    typeof window !== "undefined" ? window.innerHeight - 380 : position.y
  );

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!linkedTask) return;
    setError(null);
    setSaving(true);
    const { data, error: err } = await supabase
      .from("tasks")
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        location: editLocation.trim() || null,
        priority: editPriority,
        status: editStatus,
      })
      .eq("id", linkedTask.id)
      .select("*")
      .single();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      onTaskUpdated?.(data as Task);
      setEditing(false);
    }
  }

  return (
    <div
      className="fixed z-50 rounded-lg border border-[#E8DCC8] bg-white shadow-xl p-4 space-y-3"
      style={{ left: x, top: y, width: modalWidth }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#562F00]">Task at pin</span>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onClose}>
          ×
        </Button>
      </div>

      {editing && linkedTask ? (
        <form onSubmit={handleSaveEdit} className="space-y-3">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="tm-title" className="text-xs">Title *</Label>
            <Input
              id="tm-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tm-location" className="text-xs">Location / room</Label>
            <Input
              id="tm-location"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tm-priority" className="text-xs">Priority</Label>
            <Select
              value={editPriority}
              onValueChange={(v) => setEditPriority(v as "high" | "medium" | "low")}
            >
              <SelectTrigger id="tm-priority" className="h-8 text-sm w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-100" position="popper">
                {priorities.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tm-status" className="text-xs">Status</Label>
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger id="tm-status" className="h-8 text-sm w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-100" position="popper">
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tm-desc" className="text-xs">Description</Label>
            <textarea
              id="tm-desc"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || !editTitle.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      ) : (
        <>
          {linkedTask && (
            <div className="text-sm text-[#8B6914]">
              Current: <span className="font-medium text-[#562F00]">{linkedTask.title}</span>{" "}
              ({statusLabels[linkedTask.status ?? "pending"]})
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#A08050]">Assign task</label>
            <Select
              value={selectedTaskId}
              onValueChange={(v) => {
                setSelectedTaskId(v);
                onLinkTask(pin.id, v);
                onClose();
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose task…" />
              </SelectTrigger>
              <SelectContent className="z-100" position="popper">
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title} — {statusLabels[t.status ?? "pending"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={`/project/${projectId}/task/new`}>New task</Link>
            </Button>
            {linkedTask && (
              <Button type="button" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5 mr-1" />
                Edit task
              </Button>
            )}
            {onDeletePin && pin && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  await onDeletePin(pin.id);
                  onClose();
                }}
              >
                <Trash2 className="size-3.5 mr-1" />
                Delete pin
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
