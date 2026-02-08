"use client";

import { useState } from "react";
import type { Task, ActivityFeedItem } from "@/types/database";

type Props = {
  projectId: string;
  projectName: string;
  tasks: Task[];
  activity: ActivityFeedItem[];
  since: string;
};

export function ReportExport({ projectName, tasks, activity, since }: Props) {
  const [loading, setLoading] = useState(false);

  function downloadCsv() {
    setLoading(true);
    const rows: string[][] = [
      ["Bild — Project Report", projectName],
      ["Generated", new Date().toISOString()],
      ["Since", since],
      [],
      ["Tasks"],
      ["Title", "Status", "Priority", "Location", "Due date", "Completed at"],
      ...tasks.map((t) => [
        t.title,
        t.status ?? "",
        t.priority ?? "",
        t.location ?? "",
        t.due_date ?? "",
        t.completed_at ?? "",
      ]),
      [],
      ["Recent activity"],
      ["Action", "Created at"],
      ...activity.map((a) => [a.action, a.created_at ?? ""]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bild-report-${projectName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={downloadCsv}
      disabled={loading}
      className="rounded-lg border border-[#E8DCC8] bg-white px-4 py-2 text-sm font-medium text-[#562F00] hover:bg-[#FFF5EB] disabled:opacity-60"
    >
      {loading ? "Exporting…" : "Export CSV"}
    </button>
  );
}
