# Bild — Proof-of-work for construction

**UGA Hacks submission.** Proof-of-work for construction, without slowing the job.

---

## Team

- **Ron**
- **Paul**

---

## Purpose of the project

Construction runs on what happens in the field, but poor project data and miscommunication cost the U.S. industry **$177B+** annually; **48%** of rework ties to communication and bad project info. Workers lose **14+ hours/week** on search, conflict, and rework, while **91%** of teams still use paper and **&lt;30%** of projects finish on time and on budget.

**Bild** addresses this by building proof into the job:

- **Field workers (mobile):** Join by code, see tasks and a Blueprint view, and complete work with **photo + voice** proof (voice is AI-transcribed). They can also ask **Bob**, an AI that answers questions from project PDFs with citations.
- **Supervisors (web):** Real-time dashboard (completion %, blockers, task pipeline), **proof viewer** per task, **Blueprint** (draw rooms, place task pins), **Bob** over project docs, and **reports** (CSV export).

We interviewed the owner of a construction company who validated the problem and the “proof built in” approach.

---

## Tools utilized

| Layer | Technology |
|-------|------------|
| **Mobile** | Expo (React Native) SDK 54, TypeScript, expo-router, expo-camera, expo-audio |
| **Web** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions / Deno) |
| **AI** | Google Gemini (voice transcription, proof-completeness hints, File Search API for Bob RAG) |
| **Hosting** | Vercel (web), Expo (mobile) |

---

## Problems we ran into and how we overcame them

1. **JWT + Supabase Edge Functions**  
   With Supabase’s newer JWT signing (ES256), the Edge gateway’s `verify_jwt` rejected our requests. We **passed the user’s `access_token` in the request body** and validated it inside the function with `supabase.auth.getUser(token)` so Bob works for both web and mobile.

2. **Keeping scope tight**  
   We interviewed a construction company owner who said not to make it “another thing to chase.” We **stuck to “three taps to complete”** and made proof mandatory so we didn’t add extra features that wouldn’t get used.

3. **One backend, two clients**  
   Keeping mobile and web in sync required **shared data shapes and types** and a single Supabase project plus one set of Edge Functions so both apps stay consistent.

---

## Credit — public frameworks and APIs

We used and credit the following:

- **[Supabase](https://supabase.com)** — PostgreSQL, Auth, Storage, Realtime, Edge Functions (Deno). [Documentation](https://supabase.com/docs).
- **[Google Gemini](https://ai.google.dev)** — Generative AI API for voice-to-text transcription and for **Bob** (RAG via [File Search API](https://ai.google.dev/gemini-api/docs/file-search)). [Gemini API docs](https://ai.google.dev/gemini-api/docs).
- **[Expo](https://expo.dev)** — React Native (SDK 54), expo-router, expo-camera, expo-audio. [Expo docs](https://docs.expo.dev).
- **[Next.js](https://nextjs.org)** — React framework (App Router). [Next.js docs](https://nextjs.org/docs).
- **[Tailwind CSS](https://tailwindcss.com)** — Styling. [Tailwind docs](https://tailwindcss.com/docs).
- **[shadcn/ui](https://ui.shadcn.com)** — UI components (Radix-based). [shadcn docs](https://ui.shadcn.com).
- **[Recharts](https://recharts.org)** — Charts on the web dashboard. [Recharts docs](https://recharts.org/en-US).
- **[Lucide](https://lucide.dev)** — Icons. [Lucide](https://lucide.dev).

---

## Repository structure

- **`bild-mobile/`** — Expo (React Native) app for field workers.
- **`bild-web/`** — Next.js dashboard for supervisors.
- **`docs/`** — Project docs (technical improvements, Devpost content, presentation).

Both apps share the same Supabase project and Edge Functions (`bob-sync`, `bob-chat`) under `bild-web/supabase/functions/` and `bild-mobile/supabase/functions/`.

---

## Running the project

### Mobile (Expo)

```bash
cd bild-mobile
cp .env.example .env   # set EXPO_PUBLIC_SUPABASE_*, EXPO_PUBLIC_GEMINI_API_KEY
npm install --legacy-peer-deps
npx expo start
```

### Web (Next.js)

```bash
cd bild-web
# create .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Presentation slides: [http://localhost:3000/presentation](http://localhost:3000/presentation).
