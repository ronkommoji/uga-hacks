-- Allow authenticated project members to insert project_files (e.g. blueprint upload)
CREATE POLICY project_files_insert_authenticated ON public.project_files
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_project_member(project_id));
