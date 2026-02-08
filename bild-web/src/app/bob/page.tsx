"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, Bot, User, RefreshCw, FileText } from "lucide-react";
import { useFilePreview } from "@/components/file-preview";

/** If the project was synced within this window, we skip calling bob-sync and use the existing store. */
const RECENT_SYNC_MS = 60 * 60 * 1000; // 1 hour

/** Call an Edge Function using the Supabase client so the session JWT is sent correctly (fixes 401). */
async function invokeWithAuth(
  name: string,
  body: Record<string, unknown>
): Promise<{ data: unknown; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const msg =
      typeof (error as { context?: { body?: { error?: string } } })?.context?.body?.error === "string"
        ? (error as { context: { body: { error: string } } }).context.body.error
        : error.message || "Request failed";
    return { data: null, error: msg };
  }
  if (data && typeof data === "object" && "error" in data && typeof (data as { error: string }).error === "string")
    return { data, error: (data as { error: string }).error };
  return { data: data ?? null, error: null };
}

export type Citation = {
  title?: string;
  startIndex?: number;
  endIndex?: number;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

export default function BobPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const { user, loading: authLoading } = useAuth();
  const { openPreview } = useFilePreview();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncDone, setSyncDone] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const hasSyncedForProject = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();
      setProjectName(data?.name ?? null);
    })();
  }, [projectId]);

  // Sync files with Bob when entering the page. Skip API call if DB says we synced recently (persists across tab switches).
  useEffect(() => {
    if (authLoading || !user || !projectId || hasSyncedForProject.current === projectId) return;
    setSyncing(true);
    setSyncError(null);
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSyncing(false);
        setSyncError("Please log in to sync.");
        return;
      }
      await supabase.auth.refreshSession();
      // Check DB: if project was synced recently and has a store, skip calling bob-sync
      const { data: projectRow } = await supabase
        .from("projects")
        .select("gemini_file_search_synced_at, gemini_file_search_store_name")
        .eq("id", projectId)
        .single();
      const syncedAt = projectRow?.gemini_file_search_synced_at;
      const storeName = projectRow?.gemini_file_search_store_name;
      if (syncedAt && storeName) {
        const elapsed = Date.now() - new Date(syncedAt).getTime();
        if (elapsed < RECENT_SYNC_MS) {
          hasSyncedForProject.current = projectId;
          setSyncDone(true);
          setSyncing(false);
          return;
        }
      }
      const { data, error } = await invokeWithAuth("bob-sync", { project_id: projectId });
      setSyncing(false);
      if (!error && !(data as { error?: string } | null)?.error) {
        hasSyncedForProject.current = projectId;
        setSyncDone(true);
      }
      if ((data as { error?: string } | null)?.error)
        setSyncError((data as { error: string }).error);
      if (error) setSyncError(error);
    })();
  }, [projectId, user, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !projectId || sending) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setChatError("Please log in to chat with Bob.");
      return;
    }
    await supabase.auth.refreshSession();
    setInput("");
    setChatError(null);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    const { data, error } = await invokeWithAuth("bob-chat", {
      project_id: projectId,
      message: text,
    });

    setSending(false);
    if (error) {
      setChatError(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, something went wrong: ${error}`,
        },
      ]);
      return;
    }
    if ((data as { error?: string } | null)?.error) {
      const errMsg = (data as { error: string }).error;
      setChatError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: String(errMsg),
        },
      ]);
      return;
    }
    const payload = data as { text?: string; citations?: Citation[] };
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: payload?.text ?? "No response.",
      citations: Array.isArray(payload?.citations) ? payload.citations : undefined,
    };
    setMessages((prev) => [...prev, assistantMsg]);
  }, [input, projectId, sending]);

  const handleResync = useCallback(async () => {
    if (!projectId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setSyncError("Please log in to sync.");
      return;
    }
    await supabase.auth.refreshSession();
    hasSyncedForProject.current = null;
    setSyncDone(false);
    setSyncError(null);
    setSyncing(true);
    const { data, error } = await invokeWithAuth("bob-sync", { project_id: projectId });
    setSyncing(false);
    if (!error && !(data as { error?: string } | null)?.error) {
      hasSyncedForProject.current = projectId;
      setSyncDone(true);
    }
    if ((data as { error?: string } | null)?.error)
      setSyncError((data as { error: string }).error);
    if (error) setSyncError(error);
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-[#562F00]">Bob</h1>
        <p className="mt-2 text-[#A08050]">
          Select a project to ask Bob questions about your project files.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-[#562F00]">Bob</h1>
        <p className="mt-2 text-[#A08050]">
          Log in to sync project files and chat with Bob.
        </p>
        <Button asChild className="mt-4">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  // One beige for the whole Bob block (header + chat + input) so it’s distinct from the main background
  const bobBeige = "bg-[#F5F0E6]";

  return (
    <div className={`flex h-full min-h-[70vh] flex-col ${bobBeige}`}>
      <div className="border-b border-[#E8DCC8] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#562F00]">Bob</h1>
            <p className="text-sm text-[#A08050]">
              {projectName ? `Project: ${projectName}` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {syncing && (
              <span className="flex items-center gap-1.5 text-sm text-[#8B6914]">
                <Loader2 className="size-4 animate-spin" />
                Syncing files…
              </span>
            )}
            {syncDone && !syncing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResync}
                disabled={syncing}
              >
                <RefreshCw className="size-3.5 mr-1" />
                Resync files
              </Button>
            )}
          </div>
        </div>
        {syncError && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {syncError}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-4">
          {messages.length === 0 && !syncing && (
            <Card className="border-[#E8DCC8] bg-[#FFFDF1]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Bot className="size-12 text-[#FF9644] mb-4" />
                <h2 className="text-lg font-semibold text-[#562F00]">
                  Ask Bob about your project
                </h2>
                <p className="mt-2 max-w-sm text-sm text-[#A08050]">
                  Bob uses the files you’ve uploaded to this project to answer
                  questions. We use the last sync time from the project; you can resync if
                  you’ve added new files.
                </p>
                {!syncDone && !syncing && syncError && (
                  <p className="mt-2 text-sm text-destructive">
                    Sync failed. Try &quot;Resync files&quot; or upload files in
                    the Files tab first.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          <div className="space-y-4 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFCE99]">
                    <Bot className="size-4 text-[#562F00]" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#FF9644] text-white"
                      : "bg-white border border-[#E8DCC8] text-[#562F00]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs opacity-80">
                    {msg.role === "user" ? (
                      <User className="size-3.5" />
                    ) : (
                      <Bot className="size-3.5" />
                    )}
                    <span>
                      {msg.role === "user" ? "You" : "Bob"}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{msg.content}</p>
                  {msg.role === "assistant" &&
                    msg.citations &&
                    msg.citations.length > 0 &&
                    projectId && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#E8DCC8] pt-2 text-xs text-[#A08050]">
                        <FileText className="size-3.5 shrink-0" />
                        <span>Based on:</span>
                        {msg.citations.map((c, i) => {
                          const label = c?.title ?? "Document";
                          const hasHighlight =
                            typeof c?.startIndex === "number" && typeof c?.endIndex === "number";
                          return (
                            <span key={i}>
                              <button
                                type="button"
                                className="text-primary hover:underline font-medium"
                                onClick={() =>
                                  openPreview(
                                    projectId,
                                    label,
                                    hasHighlight
                                      ? { startIndex: c.startIndex!, endIndex: c.endIndex! }
                                      : undefined
                                  )
                                }
                              >
                                {label}
                              </button>
                              {i < msg.citations!.length - 1 ? ", " : ""}
                            </span>
                          );
                        })}
                      </div>
                    )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DCC8]">
                    <User className="size-4 text-[#562F00]" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFCE99]">
                  <Bot className="size-4 text-[#562F00]" />
                </div>
                <div className="rounded-xl border border-[#E8DCC8] bg-white px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-[#8B6914]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="border-t border-[#E8DCC8] bg-[#F5F0E6] p-4">
        {chatError && (
          <p className="mb-2 text-sm text-destructive" role="alert">
            {chatError}
          </p>
        )}
        <form
          className="mx-auto flex max-w-3xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Bob about your project files…"
            className="flex-1 border-[#E8DCC8] bg-white placeholder:text-[#A08050]"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
