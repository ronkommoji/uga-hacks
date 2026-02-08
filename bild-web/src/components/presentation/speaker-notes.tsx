"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SlideConfig } from "./slides-data";

export function SpeakerNotes({ slide }: { slide: SlideConfig }) {
  const [open, setOpen] = useState(false);
  if (!slide.script?.length) return null;

  return (
    <div
      className="absolute bottom-4 left-4 right-24 z-20 max-w-xl"
      style={{ color: "var(--color-foreground)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border-2 px-4 py-2 text-left text-sm transition-colors hover:opacity-90"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <span className="font-medium">Speaker notes</span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {open && (
        <div
          className="mt-2 rounded-lg border-2 p-4 text-sm space-y-3 max-h-40 overflow-y-auto"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
          }}
        >
          {slide.script.map((s, i) => (
            <div key={i}>
              <span
                className="font-semibold text-xs uppercase tracking-wider"
                style={{ color: "var(--color-primary)" }}
              >
                {s.speaker}:
              </span>{" "}
              <span style={{ color: "var(--color-foreground)" }}>{s.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
