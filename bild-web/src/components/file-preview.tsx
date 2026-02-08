"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { ProjectFile } from "@/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";

const BUCKET = "project-files";

const TEXT_TYPES = new Set([
  "text/plain",
  "text/html",
  "text/csv",
  "application/json",
  "text/markdown",
]);

type Highlight = { startIndex: number; endIndex: number };

type FilePreviewState = {
  file: ProjectFile | null;
  projectId: string | null;
  highlight: Highlight | null;
};

type FilePreviewContextValue = {
  openPreview: (
    projectId: string,
    fileOrName: ProjectFile | string,
    highlight?: Highlight
  ) => void;
  closePreview: () => void;
};

const FilePreviewContext = createContext<FilePreviewContextValue | null>(null);

export function useFilePreview() {
  const ctx = useContext(FilePreviewContext);
  if (!ctx) throw new Error("useFilePreview must be used within FilePreviewProvider");
  return ctx;
}

export function FilePreviewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FilePreviewState>({
    file: null,
    projectId: null,
    highlight: null,
  });
  const [open, setOpen] = useState(false);

  const openPreview = useCallback(
    async (
      projectId: string,
      fileOrName: ProjectFile | string,
      highlight?: Highlight
    ) => {
      if (typeof fileOrName === "string") {
        const { data } = await supabase
          .from("project_files")
          .select("*")
          .eq("project_id", projectId)
          .eq("name", fileOrName)
          .limit(1)
          .maybeSingle();
        if (!data) return;
        setState({ file: data as ProjectFile, projectId, highlight: highlight ?? null });
      } else {
        setState({ file: fileOrName, projectId, highlight: highlight ?? null });
      }
      setOpen(true);
    },
    []
  );

  const closePreview = useCallback(() => {
    setOpen(false);
    setState({ file: null, projectId: null, highlight: null });
  }, []);

  return (
    <FilePreviewContext.Provider value={{ openPreview, closePreview }}>
      {children}
      <FilePreviewSheet
        open={open}
        onOpenChange={(v) => !v && closePreview()}
        file={state.file}
        projectId={state.projectId}
        highlight={state.highlight}
      />
    </FilePreviewContext.Provider>
  );
}

function FilePreviewSheet({
  open,
  onOpenChange,
  file,
  projectId,
  highlight,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: ProjectFile | null;
  projectId: string | null;
  highlight: Highlight | null;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"text" | "pdf" | "unsupported">("text");
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !file || !projectId) {
      setContent(null);
      setPreviewUrl(null);
      setError(null);
      setPreviewType("text");
      return;
    }

    const contentType = file.content_type || "";
    const isPdf = contentType === "application/pdf";
    const isText = TEXT_TYPES.has(contentType) || contentType.startsWith("text/");

    if (isPdf) {
      setPreviewType("pdf");
      setLoading(true);
      setError(null);
      supabase.storage
        .from(BUCKET)
        .createSignedUrl(file.file_path, 3600)
        .then(({ data }) => {
          setPreviewUrl(data?.signedUrl ?? null);
          setLoading(false);
          if (!data?.signedUrl) setError("Could not load PDF.");
        })
        .catch(() => {
          setError("Failed to load file.");
          setLoading(false);
        });
      return;
    }

    if (isText) {
      setPreviewType("text");
      setLoading(true);
      setError(null);
      supabase.storage
        .from(BUCKET)
        .download(file.file_path)
        .then(({ data, error: e }) => {
          setLoading(false);
          if (e) {
            setError(e.message);
            return;
          }
          if (!data) {
            setError("No content");
            return;
          }
          data.text().then(setContent);
        })
        .catch(() => {
          setLoading(false);
          setError("Failed to load file.");
        });
      return;
    }

    setPreviewType("unsupported");
    setContent(null);
    setError(null);
  }, [open, file?.id, projectId, file?.file_path, file?.content_type]);

  // Clean up object URL for PDF if we ever create one from blob
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const renderTextWithHighlight = () => {
    if (content == null) return null;
    if (!highlight || highlight.startIndex == null || highlight.endIndex == null) {
      return (
        <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground">
          {content}
        </pre>
      );
    }
    const start = Math.max(0, Math.min(highlight.startIndex, content.length));
    const end = Math.max(start, Math.min(highlight.endIndex, content.length));
    const before = content.slice(0, start);
    const segment = content.slice(start, end);
    const after = content.slice(end);
    return (
      <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground">
        {before}
        <mark className="rounded bg-amber-200/80 px-0.5 text-foreground underline decoration-amber-600">
          {segment}
        </mark>
        {after}
      </pre>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-2xl flex-col overflow-hidden p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b border-[#E8DCC8] px-4 py-3">
          <SheetTitle className="truncate text-base font-semibold text-[#562F00]">
            {file?.name ?? "Preview"}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-[#8B6914]" />
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && previewType === "text" && (
            <div className="min-h-0">{renderTextWithHighlight()}</div>
          )}
          {!loading && !error && previewType === "pdf" && previewUrl && (
            <iframe
              title={file?.name ?? "PDF"}
              src={previewUrl}
              className="h-full min-h-[60vh] w-full rounded border border-[#E8DCC8]"
            />
          )}
          {!loading && !error && previewType === "unsupported" && file && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Preview not available for this file type.</p>
              <a
                href="#"
                className="text-primary hover:underline"
                onClick={async (e) => {
                  e.preventDefault();
                  const { data } = await supabase.storage
                    .from(BUCKET)
                    .createSignedUrl(file.file_path, 60);
                  if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                }}
              >
                Download file
              </a>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
