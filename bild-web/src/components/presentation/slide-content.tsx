"use client";

import Image from "next/image";
import type { SlideConfig } from "./slides-data";

const accentShape = (
  <div
    className="absolute pointer-events-none opacity-15"
    aria-hidden
    style={{
      background: "radial-gradient(circle at 50% 50%, var(--color-accent) 0%, transparent 70%)",
      width: "min(80vw, 500px)",
      height: "min(80vw, 500px)",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
    }}
  />
);

export function SlideContent({ slide }: { slide: SlideConfig; index: number }) {
  const isTitle = slide.type === "title";
  const isDemoCta = slide.type === "demo-cta";
  const isProblemStats = slide.type === "problem-stats";
  const isProblemQuotes = slide.type === "problem-quotes";

  if (isTitle) {
    return (
      <div className="relative min-h-full w-full flex flex-col items-center justify-center px-6 py-10 overflow-hidden">
        {accentShape}
        <div className="relative z-10 text-center space-y-5 animate-in fade-in-0 duration-500">
          <div className="flex justify-center">
            <Image
              src="/icon.png"
              alt="Bild"
              width={80}
              height={80}
              className="rounded-2xl shadow-lg"
            />
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            {slide.title}
          </h1>
          <p
            className="text-lg md:text-xl font-medium max-w-xl mx-auto"
            style={{ color: "var(--color-primary)" }}
          >
            {slide.tagline}
          </p>
          {slide.subtitle && (
            <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
              {slide.subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isDemoCta) {
    return (
      <div className="relative min-h-full w-full flex flex-col items-center justify-center px-6 py-10 overflow-hidden">
        {accentShape}
        <div className="relative z-10 text-center space-y-6 animate-in fade-in-0 duration-500">
          <h1
            className="text-4xl md:text-5xl font-bold"
            style={{ color: "var(--color-foreground)" }}
          >
            {slide.title}
          </h1>
          <p
            className="text-xl md:text-2xl font-medium max-w-lg mx-auto"
            style={{ color: "var(--color-primary)" }}
          >
            {slide.tagline}
          </p>
          <p
            className="text-2xl md:text-3xl font-semibold pt-4"
            style={{ color: "var(--color-foreground)" }}
          >
            {slide.subtitle}
          </p>
        </div>
      </div>
    );
  }

  if (isProblemStats) {
    const stats = slide.bigStats ?? [];
    return (
      <div className="relative min-h-full w-full flex flex-col items-center justify-center px-6 py-8 overflow-hidden">
        {accentShape}
        <div className="relative z-10 w-full max-w-4xl mx-auto space-y-6 animate-in fade-in-0 duration-500">
          <h2
            className="text-2xl md:text-3xl font-bold text-center"
            style={{ color: "var(--color-foreground)" }}
          >
            {slide.title}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border-2 p-4 flex flex-col"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <span
                  className="text-2xl md:text-3xl font-bold tabular-nums"
                  style={{ color: "var(--color-primary)" }}
                >
                  {s.value}
                </span>
                <span className="text-xs md:text-sm mt-1" style={{ color: "var(--color-foreground)" }}>
                  {s.label}
                </span>
                {s.source && (
                  <span className="text-[10px] md:text-xs mt-1 italic" style={{ color: "var(--color-text-muted)" }}>
                    {s.source}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isProblemQuotes) {
    const quotes = slide.quotes ?? [];
    return (
      <div className="relative min-h-full w-full flex flex-col items-center justify-center px-6 py-8 overflow-hidden">
        {accentShape}
        <div className="relative z-10 w-full max-w-3xl mx-auto space-y-5 animate-in fade-in-0 duration-500">
          <h2
            className="text-2xl md:text-3xl font-bold text-center"
            style={{ color: "var(--color-foreground)" }}
          >
            {slide.title}
          </h2>
          <div className="space-y-4">
            {quotes.map((q, i) => (
              <blockquote
                key={i}
                className="rounded-xl border-l-4 pl-4 pr-4 py-3"
                style={{
                  borderColor: "var(--color-primary)",
                  backgroundColor: "var(--color-secondary)",
                }}
              >
                <p className="text-sm md:text-base" style={{ color: "var(--color-foreground)" }}>
                  &ldquo;{q.quote}&rdquo;
                </p>
                <cite className="text-xs mt-1 block not-italic" style={{ color: "var(--color-text-muted)" }}>
                  — {q.attribution}
                </cite>
              </blockquote>
            ))}
            {slide.ownerQuotePlaceholder && (
              <div
                className="rounded-xl border-2 border-dashed p-4 text-center text-sm"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                {slide.ownerQuotePlaceholder}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
