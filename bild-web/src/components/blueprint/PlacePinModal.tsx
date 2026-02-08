"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

type Props = {
  projectId: string;
  tasks: Task[];
  position: { clientX: number; clientY: number };
  onClose: () => void;
  onPlace: (taskId: string) => void;
  onOpenNewTaskModal?: () => void;
  initialSelectedTaskId?: string | null;
  onClearInitialSelection?: () => void;
};

export function PlacePinModal({
  projectId,
  tasks,
  position,
  onClose,
  onPlace,
  onOpenNewTaskModal,
  initialSelectedTaskId,
  onClearInitialSelection,
}: Props) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  useEffect(() => {
    if (initialSelectedTaskId) {
      setSelectedTaskId(initialSelectedTaskId);
      onClearInitialSelection?.();
    }
  }, [initialSelectedTaskId, onClearInitialSelection]);

  const modalWidth = 320;
  const x = Math.min(
    Math.max(20, position.clientX - modalWidth / 2),
    typeof window !== "undefined" ? window.innerWidth - modalWidth - 20 : position.clientX
  );
  const y = Math.min(
    Math.max(20, position.clientY - 20),
    typeof window !== "undefined" ? window.innerHeight - 220 : position.clientY
  );

  return (
    <div
      className="fixed z-50 rounded-lg border border-[#E8DCC8] bg-white shadow-xl p-4 space-y-3"
      style={{ left: x, top: y, width: modalWidth }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#562F00]">Add task</span>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onClose}>
          ×
        </Button>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-[#A08050]">Task</label>
        <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select task…" />
          </SelectTrigger>
          <SelectContent>
            {tasks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title} — {statusLabels[t.status ?? "pending"]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {tasks.length === 0 && onOpenNewTaskModal && (
        <p className="text-xs text-[#A08050]">
          No tasks yet.{" "}
          <button
            type="button"
            onClick={onOpenNewTaskModal}
            className="text-[#FF9644] hover:underline font-medium"
          >
            Create a task
          </button>
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!selectedTaskId}
          onClick={() => selectedTaskId && onPlace(selectedTaskId)}
        >
          Add task
        </Button>
        {onOpenNewTaskModal && (
          <Button type="button" size="sm" variant="secondary" onClick={onOpenNewTaskModal}>
            New task
          </Button>
        )}
      </div>
    </div>
  );
}
