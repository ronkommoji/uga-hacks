# Bild — Codebase Technical Improvements & Feature Ideas

This document covers **technical improvements** for the Bild codebase (bild-mobile + bild-web) and **feature ideas, improvements, and future enhancements**. It is intended for developers and product planning.

---

## Part 1: Codebase Technical Improvements

### 1.1 Shared Backend & Type Safety

- **Unify database types**: `bild-mobile/types/database.ts` and `bild-web/src/types/database.ts` are maintained separately. Consider a **shared package** (e.g. `@bild/types` or a `shared/` folder in a monorepo) so schema changes propagate to both clients and reduce drift (e.g. web has `profiles.company_name`, `onboarding_completed_at`; mobile may not).
- **Supabase codegen**: Use Supabase’s TypeScript type generation (`supabase gen types typescript`) and point both apps at the same output so types stay in sync with migrations.

### 1.2 Authentication & Authorization

- **Web auth**: Web app uses AuthProvider and auth layout; ensure RLS policies and Edge Function auth (e.g. `bob-chat` with `access_token` in body) are documented and consistent. Consider moving to `verify_jwt: true` once JWT signing (ES256) is fully supported by the Edge gateway so the function doesn’t need to parse the token from the body.
- **Role-based UI**: Both apps have `is_project_supervisor` (or equivalent). Centralize role checks in a small auth/role module and use them consistently (e.g. who can create tasks, see join code, invite members).
- **Session refresh**: Mobile and web should handle token refresh and “session expired” flows uniformly (e.g. redirect to login, clear local state).

### 1.3 Edge Functions

- **Shared Edge code**: `bob-sync` and `bob-chat` live under both `bild-mobile/supabase/functions/` and `bild-web/supabase/functions/`. Prefer a **single source** (e.g. only under `bild-web/supabase/functions/` or a shared `supabase/` at repo root) and have both clients call the same deployed functions to avoid drift and duplicate maintenance.
- **Error contract**: Standardize error response shape (e.g. `{ error: string, code?: string }`) and document it so mobile and web can show user-friendly messages and handle retries consistently.
- **CORS**: Keep CORS headers in sync with actual web and mobile origins (and Expo / dev URLs) to avoid runtime failures.

### 1.4 API Keys & Secrets

- **Gemini on mobile**: Mobile uses `EXPO_PUBLIC_GEMINI_API_KEY` for client-side transcription and proof checks. For production, consider moving **all** Gemini calls (including transcription) behind Edge Functions so the API key is never in the client bundle.
- **Env validation**: Add a small runtime check (e.g. `requiredEnv('EXPO_PUBLIC_SUPABASE_URL')`) at app startup so missing env fails fast with a clear message.

### 1.5 Data Layer & Realtime

- **Realtime subscriptions**: If activity feed or task list use Supabase Realtime, document which channels are used and ensure both apps subscribe consistently (e.g. on project switch, unsubscribe from the previous project).
- **Offline / sync**: PRD mentions “offline capture with background sync”. If not fully implemented, add a clear sync status (e.g. “Pending upload”) and retry/queue logic so proof isn’t lost on poor connectivity.
- **Pagination**: For projects with many tasks or activity items, add cursor- or page-based loading (e.g. `tasks.order().range()`) to avoid loading everything at once.

### 1.6 Mobile-Specific

- **Tab naming**: Tabs are “Tasks”, “Blueprint”, “Bob”; “today” route is used for the Blueprint screen. Align route names and tab labels with the PRD (e.g. “Today” vs “Blueprint”) or document the mapping to avoid confusion.
- **Camera/audio permissions**: Ensure permission requests and fallbacks (e.g. “Open Settings”) are consistent on iOS and Android and that capture flow degrades gracefully if the user denies access.
- **Large lists**: Use `FlatList`/`SectionList` with appropriate `keyExtractor`, `getItemLayout` if needed, and avoid inline heavy components to keep scroll performance good with many tasks.

### 1.7 Web-Specific

- **Data fetching**: Prefer server components and server-side data where possible (as already done on project and task pages). For client-heavy pages (e.g. Bob chat), keep a single source of truth for “current project” (e.g. search params or context) so deep links and back navigation work.
- **Blueprint geometry**: `blueprint-geometry.ts` is duplicated in mobile and web. Extract to a shared utility (or npm package) so `pointInPolygon`, `getRoomAtPoint`, `getCentroid` are implemented once and tested in one place.
- **Accessibility**: Add ARIA labels, keyboard navigation, and focus management for blueprint canvas and modals so the dashboard is usable with screen readers and keyboard-only.

### 1.8 Testing & Quality

- **Unit tests**: Add tests for critical paths: join-by-code RPC, task status updates, proof submission, and blueprint geometry (point-in-polygon, centroid).
- **E2E**: Consider a small E2E suite (e.g. Playwright for web, Detox or Maestro for mobile) for: login → select project → complete task with proof → see proof on web.
- **Linting/format**: Enforce a single ESLint/Prettier config across both repos (or monorepo) so style and rules stay consistent.

### 1.9 Performance

- **Images**: Use appropriate sizes and caching for blueprint images and proof thumbnails (e.g. signed URLs with short TTL, or responsive image variants in storage).
- **Bob sync**: Sync can be slow with many/large files. Consider background sync, progress indicator (e.g. “Syncing 3/10 files”), and skipping RAG-unsupported types without blocking the whole sync.
- **Bundle size**: Lazy-load heavy screens (e.g. blueprint workspace, report export) where possible so initial load stays fast.

### 1.10 Documentation & Onboarding

- **README**: Each repo’s README should list: required env vars, how to run locally, and how to point at the same Supabase project (and any shared Edge Functions).
- **Architecture diagram**: Maintain a single diagram (e.g. mobile ↔ Supabase ↔ Edge ↔ Gemini) and where Bob, proof, and blueprint data live so new contributors can onboard quickly.

---

## Part 2: Feature Ideas, Improvements & Future Enhancements

### 2.1 Mobile (Field Workers)

- **True “Today” view**: A dedicated “Today” tab that shows only tasks due today (or overdue), with optional “next 3 days” filter, while keeping the full task list in “Tasks” and Blueprint in its own tab.
- **Swipe actions**: Already have swipe for In progress / Blocked; consider swipe-to-complete (with quick proof: one photo + optional voice) to reduce taps.
- **Offline queue**: Persist proof (photos + voice) in local storage when offline and sync when back online, with a clear “Pending uploads” indicator and retry.
- **Push notifications**: Remind workers of due tasks or when a task is assigned; optional “blocker resolved” or supervisor message notifications.
- **Photo annotation on device**: PRD mentions optional photo annotation (draw/text); if not fully there, add a simple draw or text overlay before submit to improve proof clarity.
- **Multi-language**: If expanding to non-English sites, add i18n for UI strings and consider language preference in profile.
- **Blueprint on mobile**: Mobile already has BlueprintView; consider read-only blueprint with tap-on-pin to open task or “navigate to capture” for that task.

### 2.2 Web (Supervisors)

- **Auth for dashboard**: Implement full auth (sign up / login) and protect all dashboard routes so the app doesn’t rely on permissive anon policies in production.
- **Task assignment**: Show assignee picker (from project members) when creating/editing tasks and filter “My tasks” on mobile when assignee is set.
- **Blueprint**: Already strong (draw rooms, place pins, link tasks). Add “filter by status” on pins (e.g. show only blocked), and optional export of blueprint + pin list as PDF.
- **Reports**: Extend report period (e.g. custom date range), add more breakdowns (by assignee, by location/room), and one-click export to PDF or email.
- **Bob on web**: Already implemented; add “Suggested questions” based on project files (e.g. “What are the safety guidelines?”) and optional multi-turn conversation history in the session.
- **File upload**: Allow drag-and-drop for project files and blueprint image; show upload progress and validation (file type, size).
- **Onboarding**: Already has company + create project + invite; add optional “Import tasks from CSV” or template (e.g. “Standard electrical checklist”) to bootstrap projects.

### 2.3 Cross-Platform & Product

- **Unified “Bob”**: Ensure Bob’s personality and system instructions are identical on web and mobile and that citations/open-in-doc behavior is consistent.
- **Activity feed on web**: Show a live or recent activity feed on the project dashboard (e.g. “John completed ‘Install outlets – Room 101’ 5 min ago”) so supervisors see field activity at a glance.
- **Join flow**: Join by link (already in onboarding) and by code (mobile + web); consider QR code for join (e.g. supervisor shows QR, worker scans to open join page with code pre-filled).
- **Company / multi-tenant**: If supporting multiple companies, scope projects and members by company (e.g. `companies` table, `projects.company_id`) and enforce visibility in RLS and UI.
- **Audit trail**: Log sensitive actions (e.g. task completed, proof submitted, member joined) with user and timestamp for compliance and dispute resolution.
- **AI enhancements**:  
  - “What’s left today?” and “What happened yesterday?” summaries (from activity + tasks) on mobile and web.  
  - Proof completeness check (already in mobile via Gemini); extend to “suggest better photo” or “add voice note” hints.  
  - Optional automatic extraction of task title/location from voice note when creating a quick task from the field.

### 2.4 Integrations & Scale

- **Calendar**: Sync due dates to Google Calendar or Outlook so supervisors and workers see deadlines in their calendar.
- **Export**: Export task list + proof links to CSV/Excel; optional integration with existing PM tools (e.g. export to Procore, Airtable).
- **API**: If third parties need to create tasks or read proof, add a small REST or GraphQL API with API keys or OAuth, backed by the same Supabase data and RLS.

### 2.5 Non-Goals (from PRD — keep in mind)

- No autonomous scheduling or replacing subcontractors.
- No full CPM or enterprise ERP replacement.
- No complex form builders in the mobile app.

Prioritize improvements that align with “proof-of-work without slowing the job” and “three taps to complete a task.”

---

## Summary Table

| Area              | Technical improvement / idea |
|-------------------|-----------------------------|
| Types             | Shared DB types; Supabase codegen |
| Auth              | Consistent JWT handling; role-based UI; session refresh |
| Edge              | Single source for bob-sync / bob-chat; standard error contract |
| Secrets           | Move all Gemini behind Edge; env validation |
| Realtime / sync   | Document Realtime; offline queue and sync status |
| Mobile            | Tab naming; permissions; list performance; Blueprint view |
| Web               | Shared blueprint-geometry; a11y; lazy-load |
| Testing           | Unit tests for RPC/geometry; E2E for core flows |
| Features (mobile) | Today view; offline queue; push; photo annotation; Blueprint tap-to-task |
| Features (web)    | Full auth; task assignment; report PDF; Bob suggestions; file upload UX |
| Product           | Unified Bob; activity feed; join via QR; company scope; audit trail; AI summaries |

Use this document to drive sprint planning, tech debt backlog, and product roadmap discussions.
