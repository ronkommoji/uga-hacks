"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, FileImage, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "bild-walkthrough-dismissed";

const ITEMS = [
  { id: "blueprint", label: "Upload your blueprint", href: (pid: string) => `/project/${pid}/blueprint`, icon: FileImage },
  { id: "files", label: "Upload project files", href: (pid: string) => `/files?project=${pid}`, icon: Upload },
] as const;

export function WalkthroughChecklist({ projectId }: { projectId: string | null }) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<{ hasBlueprint: boolean; fileCount: number } | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setDismissed(true);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      const [projectRes, filesRes] = await Promise.all([
        supabase.from("projects").select("blueprint_file_id").eq("id", projectId).single(),
        supabase.from("project_files").select("id", { count: "exact", head: true }).eq("project_id", projectId),
      ]);
      if (cancelled) return;
      setProgress({
        hasBlueprint: !!projectRes.data?.blueprint_file_id,
        fileCount: filesRes.count ?? 0,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
  }

  if (!projectId || !hydrated || dismissed) return null;

  const hasBlueprint = progress?.hasBlueprint ?? false;
  const hasFiles = (progress?.fileCount ?? 0) > 0;
  const completed = [hasBlueprint, hasFiles];
  const allDone = completed.every(Boolean);

  if (allDone) return null;

  const doneCount = [hasBlueprint, hasFiles].filter(Boolean).length;

  return (
    <Card className="mb-8 border-[#E8DCC8] bg-[#FFFDF1]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex flex-1 items-center gap-2 text-left hover:opacity-80"
          >
            <CardTitle className="text-base text-[#562F00]">Get started</CardTitle>
            <span className="text-sm text-[#A08050]">
              {doneCount}/{ITEMS.length} done
            </span>
            {collapsed ? (
              <ChevronDown className="size-4 shrink-0 text-[#A08050]" aria-hidden />
            ) : (
              <ChevronUp className="size-4 shrink-0 text-[#A08050]" aria-hidden />
            )}
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[#A08050]" onClick={handleDismiss} aria-label="Dismiss">
            <X className="size-4" />
          </Button>
        </div>
        {!collapsed && (
          <p className="text-sm text-[#A08050]">Upload a blueprint and project files to get the most out of this project.</p>
        )}
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-2 pt-0">
          {ITEMS.map((item) => {
            const completed = item.id === "blueprint" ? hasBlueprint : hasFiles;
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-[#E8DCC8] bg-white px-3 py-2"
              >
                {completed ? (
                  <Check className="size-5 shrink-0 text-green-600" aria-hidden />
                ) : (
                  <Icon className="size-5 shrink-0 text-[#A08050]" aria-hidden />
                )}
                <span className={`flex-1 text-sm ${completed ? "text-muted-foreground line-through" : "text-[#562F00]"}`}>
                  {item.label}
                </span>
                {!completed && (
                  <Link href={item.href(projectId)} className="text-sm font-medium text-[#FF9644] hover:underline">
                    Do it
                  </Link>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
