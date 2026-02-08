"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SlideContent } from "@/components/presentation/slide-content";
import { SpeakerNotes } from "@/components/presentation/speaker-notes";
import { SLIDES } from "@/components/presentation/slides-data";
import { Button } from "@/components/ui/button";

const TOTAL = SLIDES.length;

export default function PresentationPage() {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const slide = SLIDES[index];

  const goNext = useCallback(() => {
    setIndex((i) => (i < TOTAL - 1 ? i + 1 : i));
  }, []);
  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-30"
        style={{ backgroundColor: "var(--border)" }}
      >
        <div
          className="h-full transition-[width] duration-300 ease-out"
          style={{
            width: `${((index + 1) / TOTAL) * 100}%`,
            backgroundColor: "var(--primary)",
          }}
        />
      </div>

      {/* Slide number */}
      <div
        className="absolute top-4 right-4 z-20 text-sm font-medium tabular-nums"
        style={{ color: "var(--text-muted)" }}
      >
        {index + 1} / {TOTAL}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col min-h-0">
        <SlideContent slide={slide} index={index} />
      </div>

      {/* Speaker notes (collapsible) */}
      <SpeakerNotes slide={slide} />

      {/* Nav buttons */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-full size-10 shadow-md border-2"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={goNext}
          disabled={index === TOTAL - 1}
          className="rounded-full size-10 shadow-md"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <div
        className="absolute top-4 left-4 z-20 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        ← → or Space
      </div>
    </div>
  );
}
