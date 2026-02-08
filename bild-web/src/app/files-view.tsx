"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ProjectFile } from "@/types/database";
import { useFilePreview } from "@/components/file-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";

const BUCKET = "project-files";

function safeStoragePath(projectId: string, fileName: string): string {
  const ext = (fileName.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${projectId}/${crypto.randomUUID()}.${ext}`;
}

export function FilesView({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openPreview } = useFilePreview();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError(err.message);
          return;
        }
        setFiles((data as ProjectFile[]) ?? []);
        setError(null);
      });
  }, [projectId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length || !projectId) {
      e.target.value = "";
      return;
    }
    setUploading(true);
    setError(null);
    const added: ProjectFile[] = [];
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const path = safeStoragePath(projectId, file.name);
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (uploadErr) {
          setError(uploadErr.message);
          break;
        }
        const { data: row, error: insertErr } = await supabase
          .from("project_files")
          .insert({
            project_id: projectId,
            name: file.name,
            file_path: path,
            file_size: file.size,
            content_type: file.type || null,
          })
          .select("*")
          .single();
        if (insertErr) {
          setError(insertErr.message);
          break;
        }
        added.push(row as ProjectFile);
      }
      if (added.length > 0) {
        setFiles((prev) => [...added, ...prev]);
        router.refresh();
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(file: ProjectFile) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    await supabase.storage.from(BUCKET).remove([file.file_path]);
    await supabase.from("project_files").delete().eq("id", file.id);
    router.refresh();
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Files — {projectName}</CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              aria-label="Upload files"
            />
            <Button
              type="button"
              disabled={uploading}
              className="flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading…" : "Upload file(s)"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading…</p>
          ) : files.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No files yet. Upload a document.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-primary hover:underline"
                        onClick={() => openPreview(projectId, file)}
                      >
                        <FileText className="h-4 w-4" />
                        {file.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {file.file_size != null
                        ? `${(file.file_size / 1024).toFixed(1)} KB`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {file.created_at
                        ? new Date(file.created_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
