# Bild — Supervisor Dashboard

Web dashboard for Bild: proof-of-work for construction. Built for supervisors and project managers to get real-time project status, manage tasks, view proof, and export reports.

## Features

- **Project portfolio** — List all projects with status; create new projects
- **Project dashboard** — Per-project completion %, blockers, active tasks; task pipeline table with links to proof
- **Proof viewer** — Per-task view of photos, annotations, and voice transcripts
- **Create project** — Name, description, address (no auth; for demo)
- **Create task** — Title, description, location, priority, due date
- **Reports** — Summary + recent activity; export to CSV

No auth is implemented yet; the app uses Supabase anon key with permissive read/write policies for dashboard use.

## Setup

1. Copy env from the mobile app or create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- Supabase (same backend as `bild-mobile`)
- PRD colors: background `#FFFDF1`, accent `#FFCE99`, primary `#FF9644`, text `#562F00`
