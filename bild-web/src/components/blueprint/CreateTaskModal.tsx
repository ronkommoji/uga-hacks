"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/types/database";
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

const priorities = ["high", "medium", "low"] as const;

type Props = {
  projectId: string;
  position: { clientX: number; clientY: number };
  initialLocation?: string;
  onClose: () => void;
  onSuccess: (task: Task) => void;
};

export function CreateTaskModal({
  projectId,
  position,
  initialLocation = "",
  onClose,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(initialLocation);
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalWidth = 320;
  const x = Math.min(
    Math.max(20, position.clientX - modalWidth / 2),
    typeof window !== "undefined" ? window.innerWidth - modalWidth - 20 : position.clientX
  );
  const y = Math.min(
    Math.max(20, position.clientY - 20),
    typeof window !== "undefined" ? window.innerHeight - 380 : position.clientY
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setLoading(true);
    const { data, error: err } = await supabase
      .from("tasks")
      .insert({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        priority,
        status: "pending",
      })
      .select("*")
      .single();
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      onSuccess(data as Task);
      onClose();
    }
  }

  return (
    <div
      className="fixed z-60 rounded-lg border border-[#E8DCC8] bg-white shadow-xl p-4 space-y-3"
      style={{ left: x, top: y, width: modalWidth }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#562F00]">New task</span>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onClose}>
          ×
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="ct-title" className="text-xs">Title *</Label>
          <Input
            id="ct-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Install conduit"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-location" className="text-xs">Location / room</Label>
          <Input
            id="ct-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Room 101"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-priority" className="text-xs">Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as "high" | "medium" | "low")}
          >
            <SelectTrigger id="ct-priority" className="h-8 text-sm w-full">
              <SelectValue placeholder="Priority" />
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
          <Label htmlFor="ct-desc" className="text-xs">Description</Label>
          <textarea
            id="ct-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Optional details"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading || !title.trim()}>
            {loading ? "Creating…" : "Create & select"}
          </Button>
        </div>
      </form>
    </div>
  );
}
