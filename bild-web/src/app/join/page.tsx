"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const codeFromUrl = searchParams.get("code") ?? "";
  const [code, setCode] = useState(codeFromUrl);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCode((c) => (codeFromUrl && !c ? codeFromUrl : c));
  }, [codeFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      router.push(`/login?redirect=/join${code ? `?code=${encodeURIComponent(code)}` : ""}`);
      return;
    }
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a join code");
      return;
    }
    setJoining(true);
    const { data, error: rpcError } = await supabase.rpc("join_project_by_code", {
      p_join_code: trimmed,
    });
    setJoining(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const result = data as { success?: boolean; error?: string; project?: { id: string } };
    if (!result?.success) {
      setError(result?.error ?? "Invalid or expired code");
      return;
    }
    router.push(`/?project=${result.project?.id ?? ""}`);
    router.refresh();
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 flex justify-center">
        <Image src="/icon.png" alt="Bild" width={80} height={80} className="size-20 object-contain" />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Join a project</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the join code your supervisor shared with you.
          </p>
        </CardHeader>
        <CardContent>
          {!user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">You need to sign in first to join a project.</p>
              <Button asChild className="w-full">
                <Link href={`/login?redirect=/join${code ? `?code=${encodeURIComponent(code)}` : ""}`}>
                  Sign in
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Create an account</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Join code</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={10}
                  className="font-mono tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={joining || !code.trim()}>
                {joining ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Joining…
                  </>
                ) : (
                  "Join project"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
