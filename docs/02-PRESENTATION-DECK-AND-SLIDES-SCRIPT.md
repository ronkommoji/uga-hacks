# Bild — Presentation Deck & Slides Script

This document is a **presentation/deck outline** (slide-by-slide) with a **full script** for each slide. Use it to build your actual slides (e.g. in Google Slides, Keynote, or Figma) and to present live or record a voiceover. The script is written for **two speakers: Ron and Paul**; you can reassign lines or merge for a single presenter.

**Suggested deck length:** 10–12 slides, ~5–7 minutes speaking.

**Design note:** Use Bild’s PRD colors for consistency: background `#FFFDF1`, accent `#FFCE99`, primary `#FF9644`, text `#562F00`.

---

## Slide 1: Title

**Visual:**  
- **Bild** (logo if you have one)  
- Tagline: **Proof-of-work for construction, without slowing the job.**  
- Optional: short subtitle “Mobile + Web • Photo + Voice • AI that helps”  
- Team names: Ron, Paul (and roles if you want)

**Script:**

**PAUL:**  
Hi, we’re Ron and Paul, and we’re presenting Bild. Bild is proof-of-work for construction — we help field workers document work as it happens and give supervisors real-time visibility, without slowing the job.

---

## Slide 2: The problem

**Visual:**  
- Headline: **The problem**  
- Bullets or icons:  
  - Updates in phone calls & texts — no single record  
  - Inconsistent or missing daily logs  
  - Unstructured or missing photo documentation  
  - Verbal handoffs never recorded  
- Optional: stat — “Poor project data & miscommunication cost the U.S. construction industry **$30B+** annually” (FMI/PlanGrid)

**Script:**

**RON:**  
Construction runs on accurate updates from the field. But today, those updates are scattered: phone calls, texts, daily logs that are rushed or missing, and photos that aren’t tied to tasks. Verbal handoffs disappear. That leads to delays, rework, disputes, and a lack of trust in what’s actually done. Research puts the cost of poor project data and miscommunication in the tens of billions per year. We wanted to fix that.

---

## Slide 3: Our approach

**Visual:**  
- Headline: **Our approach**  
- Three pillars (icons + short text):  
  1. **Proof built in** — Complete a task only with at least one photo; optional voice, auto-transcribed  
  2. **One system** — Same backend for field (mobile) and office (web); real-time  
  3. **AI that helps** — Voice-to-text, document Q&A, gentle prompts — no extra complexity  

**Script:**

**PAUL:**  
Our approach is simple. First, proof is built in — you can’t complete a task without at least one photo, and you can add a voice note that we transcribe automatically. Second, one system: the same backend for mobile and web, so what the field does shows up for supervisors in real time. Third, we use AI only to remove friction — transcription, document Q&A, optional proof hints — not to add steps or replace human decisions.

---

## Slide 4: For field workers (mobile)

**Visual:**  
- Headline: **For field workers**  
- Screenshot or mockup: task list + Blueprint + Capture (photo + voice)  
- Short bullets:  
  - Join by code • Tasks + Blueprint view • Complete with photo + voice • Bob: Q&A over project docs  

**Script:**

**RON:**  
For field workers, we have a mobile app. You join a project with a code your supervisor shares. You see your task list — and a Blueprint view where tasks are pinned to rooms on the floor plan. To complete a task, you open Capture: take at least one photo, optionally record a voice note — we transcribe it with AI — and submit. You can also chat with Bob, our project AI, to ask questions about safety guidelines or specs; answers are grounded in your project documents with citations you can open.

---

## Slide 5: For supervisors (web)

**Visual:**  
- Headline: **For supervisors**  
- Screenshot or mockup: dashboard (KPI cards, task pipeline) + “View proof” + Blueprint  
- Short bullets:  
  - Dashboard: completion %, blockers, task pipeline • Proof viewer per task • Blueprint: rooms + pins • Reports & export  

**Script:**

**PAUL:**  
For supervisors, we have a web dashboard. You get a project view with completion percentage, blockers, and a task pipeline. Every task has a “View proof” link — you see the photos and voice transcript the worker submitted. There’s a Blueprint where you upload a floor plan, draw rooms, and place pins linked to tasks; workers see the same Blueprint on mobile. You can run reports and export to CSV. Everything is real time from the same Supabase backend.

---

## Slide 6: Demo — Worker flow (optional slide or “live demo” placeholder)

**Visual:**  
- Headline: **Demo: Worker flow**  
- Optional: single screenshot of mobile (task list or Capture) or “Live demo” / video embed  
- One line: “Join project → Tasks / Blueprint → Capture (photo + voice) → Submit”

**Script:**

**RON:**  
We’ll do a quick demo. On mobile, I’m in a project — I see my tasks and the Blueprint. I’ll complete one task: I open Capture, take a photo, record a short voice note, and submit. That’s the core flow — proof in a few taps.

*(If live: do it here. If video: “In the video you’ll see this flow in under a minute.”)*

---

## Slide 7: Demo — Supervisor view (optional slide or “live demo” placeholder)

**Visual:**  
- Headline: **Demo: Supervisor view**  
- Optional: screenshot of web dashboard or task proof view  
- One line: “Dashboard → View proof → Blueprint → Reports”

**Script:**

**PAUL:**  
On the web, as a supervisor I see the same project. I open the task we just completed and click “View proof” — there’s the photo and the voice transcript. I can open the Blueprint to see where tasks sit on the floor plan, and run reports or export to CSV. All of this is the same data the worker just submitted.

*(If live: show it. If video: “The demo video shows this end to end.”)*

---

## Slide 8: Bob — AI over your documents

**Visual:**  
- Headline: **Bob: AI over your documents**  
- Screenshot: Bob chat with a question and answer + “Source: …” citation  
- Short bullets:  
  - Ask questions in natural language • Answers from project PDFs & files • Citations you can open • Runs in Edge Functions (API key never in client)  

**Script:**

**RON:**  
Bob is our project AI. You ask questions in plain language — for example, “What are the site safety guidelines?” Bob answers using the documents you’ve uploaded to the project — PDFs, specs, whatever you store. Every answer includes citations; you can tap or click to open that document. Bob runs in Supabase Edge Functions, so the Gemini API key never touches the app — it’s secure and the same on mobile and web.

---

## Slide 9: Tech stack

**Visual:**  
- Headline: **Tech stack**  
- Two columns or a simple diagram:  
  - **Mobile:** Expo (React Native), TypeScript, Supabase, Gemini (transcription)  
  - **Web:** Next.js 16, React 19, Tailwind, Supabase, Recharts  
  - **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions), Gemini (File Search for Bob)  

**Script:**

**PAUL:**  
On the tech side: mobile is Expo and React Native with TypeScript; web is Next.js 16 and React 19 with Tailwind. Both use the same Supabase project — auth, database, storage, and Edge Functions. We use Google Gemini for voice transcription and for Bob — Bob uses the File Search API so answers are grounded in your project files. One backend, two clients.

---

## Slide 10: What we’re proud of

**Visual:**  
- Headline: **What we’re proud of**  
- Bullets:  
  - End-to-end: join → task → proof → visible on web in seconds  
  - Bob with citations: open source docs from the answer  
  - Shared Blueprint: draw on web, view on mobile  
  - Single backend: one Supabase project, one set of Edge Functions  

**Script:**

**RON:**  
We’re especially proud of a few things. The full loop works: a worker can join by code, complete a task with photo and voice, and a supervisor sees that proof on the web right away. Bob doesn’t just answer — it cites sources, and you can open those documents. The Blueprint is shared: supervisors draw rooms and place pins on the web, workers see the same view on mobile. And all of it runs on one backend — one Supabase project and one set of Edge Functions for both apps.

---

## Slide 11: What’s next

**Visual:**  
- Headline: **What’s next**  
- Short list:  
  - Full auth on web dashboard  
  - Offline capture + “pending upload” queue  
  - Push notifications (due tasks, messages)  
  - Richer reports (date range, PDF export)  

**Script:**

**PAUL:**  
Next steps: we’ll add full auth on the web dashboard, offline capture with a clear “pending upload” queue so proof isn’t lost on bad connectivity, push notifications for due tasks and messages, and richer reports — custom date ranges and PDF export. We’re focused on keeping the worker experience minimal and the supervisor view complete.

---

## Slide 12: Thank you / Q&A

**Visual:**  
- **Bild** — Proof-of-work for construction, without slowing the job  
- **Thank you**  
- Optional: Demo link, repo link, or “Questions?”  
- Ron & Paul names (and contact if desired)

**Script:**

**RON:**  
So that’s Bild — proof-of-work for construction, without slowing the job. Mobile for the field, web for supervisors, one backend, and AI that helps.

**PAUL:**  
Thanks for listening. We’re happy to take questions or show the live app.

---

## Full script (continuous, for recording or rehearsal)

Below is the **full script in one block** so you can read it straight through for a single take or rehearsal. Speaker labels are kept so you can split for two voices.

---

**PAUL:** Hi, we’re Ron and Paul, and we’re presenting Bild. Bild is proof-of-work for construction — we help field workers document work as it happens and give supervisors real-time visibility, without slowing the job.

**RON:** Construction runs on accurate updates from the field. But today, those updates are scattered: phone calls, texts, daily logs that are rushed or missing, and photos that aren’t tied to tasks. Verbal handoffs disappear. That leads to delays, rework, disputes, and a lack of trust in what’s actually done. Research puts the cost of poor project data and miscommunication in the tens of billions per year. We wanted to fix that.

**PAUL:** Our approach is simple. First, proof is built in — you can’t complete a task without at least one photo, and you can add a voice note that we transcribe automatically. Second, one system: the same backend for mobile and web, so what the field does shows up for supervisors in real time. Third, we use AI only to remove friction — transcription, document Q&A, optional proof hints — not to add steps or replace human decisions.

**RON:** For field workers, we have a mobile app. You join a project with a code your supervisor shares. You see your task list — and a Blueprint view where tasks are pinned to rooms on the floor plan. To complete a task, you open Capture: take at least one photo, optionally record a voice note — we transcribe it with AI — and submit. You can also chat with Bob, our project AI, to ask questions about safety guidelines or specs; answers are grounded in your project documents with citations you can open.

**PAUL:** For supervisors, we have a web dashboard. You get a project view with completion percentage, blockers, and a task pipeline. Every task has a “View proof” link — you see the photos and voice transcript the worker submitted. There’s a Blueprint where you upload a floor plan, draw rooms, and place pins linked to tasks; workers see the same Blueprint on mobile. You can run reports and export to CSV. Everything is real time from the same Supabase backend.

**RON:** We’ll do a quick demo. On mobile, I’m in a project — I see my tasks and the Blueprint. I’ll complete one task: I open Capture, take a photo, record a short voice note, and submit. That’s the core flow — proof in a few taps.

**PAUL:** On the web, as a supervisor I see the same project. I open the task we just completed and click “View proof” — there’s the photo and the voice transcript. I can open the Blueprint to see where tasks sit on the floor plan, and run reports or export to CSV. All of this is the same data the worker just submitted.

**RON:** Bob is our project AI. You ask questions in plain language — for example, “What are the site safety guidelines?” Bob answers using the documents you’ve uploaded to the project — PDFs, specs, whatever you store. Every answer includes citations; you can tap or click to open that document. Bob runs in Supabase Edge Functions, so the Gemini API key never touches the app — it’s secure and the same on mobile and web.

**PAUL:** On the tech side: mobile is Expo and React Native with TypeScript; web is Next.js 16 and React 19 with Tailwind. Both use the same Supabase project — auth, database, storage, and Edge Functions. We use Google Gemini for voice transcription and for Bob — Bob uses the File Search API so answers are grounded in your project files. One backend, two clients.

**RON:** We’re especially proud of a few things. The full loop works: a worker can join by code, complete a task with photo and voice, and a supervisor sees that proof on the web right away. Bob doesn’t just answer — it cites sources, and you can open those documents. The Blueprint is shared: supervisors draw rooms and place pins on the web, workers see the same view on mobile. And all of it runs on one backend — one Supabase project and one set of Edge Functions for both apps.

**PAUL:** Next steps: we’ll add full auth on the web dashboard, offline capture with a clear “pending upload” queue so proof isn’t lost on bad connectivity, push notifications for due tasks and messages, and richer reports — custom date ranges and PDF export. We’re focused on keeping the worker experience minimal and the supervisor view complete.

**RON:** So that’s Bild — proof-of-work for construction, without slowing the job. Mobile for the field, web for supervisors, one backend, and AI that helps.

**PAUL:** Thanks for listening. We’re happy to take questions or show the live app.

---

## Slide deck checklist

When building the actual slides:

- [ ] Slide 1: Title + tagline + team  
- [ ] Slide 2: Problem (bullets + optional $30B stat)  
- [ ] Slide 3: Approach (proof built in, one system, AI that helps)  
- [ ] Slide 4: Mobile (tasks, Blueprint, Capture, Bob)  
- [ ] Slide 5: Web (dashboard, proof, Blueprint, reports)  
- [ ] Slide 6: Demo worker (screenshot or “live” placeholder)  
- [ ] Slide 7: Demo supervisor (screenshot or “live” placeholder)  
- [ ] Slide 8: Bob (screenshot + citations)  
- [ ] Slide 9: Tech stack  
- [ ] Slide 10: What we’re proud of  
- [ ] Slide 11: What’s next  
- [ ] Slide 12: Thank you / Q&A  

Use **#FFFDF1**, **#FFCE99**, **#FF9644**, and **#562F00** for a consistent Bild look. Replace placeholders (e.g. “Live demo”) with real screenshots or an embedded demo video when you have it.
