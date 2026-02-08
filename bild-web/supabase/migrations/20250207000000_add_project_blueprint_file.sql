-- Link the project's blueprint image to a row in project_files.
-- One blueprint per project. Run in Supabase SQL Editor or via Supabase MCP.

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS blueprint_file_id uuid NULL;

-- Optional: enforce that the referenced row exists (uncomment if desired)
-- ALTER TABLE public.projects
--   ADD CONSTRAINT projects_blueprint_file_id_fkey
--   FOREIGN KEY (blueprint_file_id) REFERENCES public.project_files(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.projects.blueprint_file_id IS 'References project_files.id for the project blueprint image.';
