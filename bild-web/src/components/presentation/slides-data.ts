/**
 * Simple 4-slide deck: problem (data + quotes) → demo.
 * Stats from PlanGrid/FMI, ACP, FieldWire, etc. Owner quote placeholder for you to add.
 */

export type SlideType = "title" | "problem-stats" | "problem-quotes" | "demo-cta";

export type Speaker = "RON" | "PAUL";

export interface SlideScript {
  speaker: Speaker;
  text: string;
}

export interface BigStat {
  value: string;
  label: string;
  source?: string;
}

export interface QuoteItem {
  quote: string;
  attribution: string;
}

export interface SlideConfig {
  type: SlideType;
  title?: string;
  subtitle?: string;
  tagline?: string;
  /** For problem-stats: big numbers to show */
  bigStats?: BigStat[];
  /** For problem-quotes */
  quotes?: QuoteItem[];
  /** Placeholder text when you add owner quote later */
  ownerQuotePlaceholder?: string;
  script: SlideScript[];
}

export const SLIDES: SlideConfig[] = [
  {
    type: "title",
    title: "Bild",
    tagline: "Proof-of-work for construction, without slowing the job.",
    subtitle: "Demo",
    script: [
      {
        speaker: "PAUL",
        text: "We're Ron and Paul. This is Bild — proof-of-work for construction. We'll keep the slides short and show you the product.",
      },
    ],
  },
  {
    type: "problem-stats",
    title: "The problem: real numbers",
    bigStats: [
      { value: "$177B", label: "U.S. construction labor cost lost annually to non‑productive activities", source: "PlanGrid / FMI" },
      { value: "$31.3B", label: "Rework cost per year from poor communication & bad project data", source: "PlanGrid / FMI" },
      { value: "48%", label: "Of all rework is due to poor communication and poor project information", source: "FMI / ACP" },
      { value: "14+ hrs", label: "Per week per worker on searching for info, conflict resolution, and rework", source: "Construction Disconnected report" },
      { value: "91%", label: "Of construction teams still use paper in their processes", source: "Industry surveys" },
      { value: "<30%", label: "Of projects finish on time and on budget", source: "FieldWire" },
    ],
    script: [
      {
        speaker: "RON",
        text: "The numbers are stark. Poor data and miscommunication cost the industry over 177 billion dollars a year in labor. Thirty-one billion of that is rework alone — and almost half of all rework ties back to communication and bad project info. Workers lose over 14 hours a week on search, conflict, and rework. Most teams still run on paper, and fewer than 30 percent of projects finish on time and on budget.",
      },
    ],
  },
  {
    type: "problem-quotes",
    title: "What we hear in the field",
    quotes: [
      {
        quote: "Daily reports are a big pain — time-consuming. I spend at least an hour after my shift compiling them.",
        attribution: "Foremen / superintendents (industry surveys)",
      },
      {
        quote: "Only 11% of field personnel always have access to the project information they need.",
        attribution: "2024 construction coordination research",
      },
      {
        quote: "55% of potentially useful project data is inaccessible to construction teams.",
        attribution: "Industry data / ACP",
      },
    ],
    ownerQuotePlaceholder: "We interviewed the owner of a construction company who validated our approach — his quotes will be added here.",
    script: [
      {
        speaker: "PAUL",
        text: "On the ground it's the same story. Foremen say daily logs are a pain and eat an hour after shift. Only 11 percent of field workers say they always have the info they need. And over half of useful project data never reaches the teams that need it. We also spoke with a construction company owner who validated our idea — we'll drop his quotes in here.",
      },
    ],
  },
  {
    type: "demo-cta",
    title: "Bild",
    tagline: "Proof built in. Photo + voice. Real-time for supervisors.",
    subtitle: "Let's demo.",
    script: [
      {
        speaker: "RON",
        text: "Bild is proof built into the job — photo and voice in a few taps, real-time visibility for supervisors. Let's show you.",
      },
    ],
  },
];
