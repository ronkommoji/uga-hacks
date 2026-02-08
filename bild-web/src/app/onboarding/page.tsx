"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Mail, Users, Loader2 } from "lucide-react";

const STEPS = ["Company", "Create project", "Invite team"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refetchProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState(profile?.company_name ?? "");
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{ id: string; name: string; join_code: string } | null>(null);
  const [members, setMembers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [copied, setCopied] = useState(false);

  const joinLink =
    typeof window !== "undefined" && createdProject
      ? `${window.location.origin}/join?code=${encodeURIComponent(createdProject.join_code)}`
      : "";

  async function saveCompanyAndNext() {
    setError(null);
    if (!user?.id) return;
    const { error: err } = await supabase
      .from("profiles")
      .update({ company_name: companyName.trim() || null })
      .eq("id", user.id);
    if (err) {
      setError(err.message);
      return;
    }
    setStep(1);
  }

  async function createProjectAndNext() {
    setError(null);
    if (!user?.id || !projectName.trim()) return;
    setCreating(true);
    const { data: project, error: insertErr } = await supabase
      .from("projects")
      .insert({
        name: projectName.trim(),
        created_by: user.id,
        status: "active",
      })
      .select("id, name, join_code")
      .single();
    setCreating(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    if (!project) return;
    const { error: memberErr } = await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "supervisor",
    });
    if (memberErr) {
      setError(memberErr.message);
      return;
    }
    setCreatedProject({
      id: project.id,
      name: project.name,
      join_code: project.join_code,
    });
    setStep(2);
    loadMembers(project.id);
  }

  async function loadMembers(projectId: string) {
    const { data: rows } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId);
    if (!rows?.length) return;
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", rows.map((r) => r.user_id));
    setMembers(profiles ?? []);
  }

  async function finishOnboarding() {
    setError(null);
    if (!user?.id) return;
    const { error: err } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    if (err) {
      setError(err.message);
      return;
    }
    await refetchProfile();
    router.push(`/?project=${createdProject?.id ?? ""}`);
    router.refresh();
  }

  function copyJoinLink() {
    if (!joinLink) return;
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyCode() {
    if (!createdProject?.join_code) return;
    navigator.clipboard.writeText(createdProject.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-6 flex justify-center">
        <Image src="/icon.png" alt="Bild" width={80} height={80} className="size-20 object-contain" />
      </div>
      <div className="mb-6 flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-16 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            aria-hidden
          />
        ))}
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">
            {step === 0 && "Your company"}
            {step === 1 && "Create your first project"}
            {step === 2 && "Invite your team"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === 0 && "We use this to personalize your experience."}
            {step === 1 && "Projects help you organize work by job site or client."}
            {step === 2 && "Share the join code or link so others can join this project."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Construction"
                />
              </div>
              <Button onClick={saveCompanyAndNext} className="w-full">
                Continue
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="projectName">Project name</Label>
                <Input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Main Street Renovation"
                  required
                />
              </div>
              <Button onClick={createProjectAndNext} className="w-full" disabled={creating || !projectName.trim()}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create project"
                )}
              </Button>
            </>
          )}

          {step === 2 && createdProject && (
            <>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <p className="text-sm font-medium">Join code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-background px-3 py-2 text-lg font-mono tracking-wider">
                    {createdProject.join_code}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyCode} title="Copy code">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Or share this link:</p>
                <div className="flex items-center gap-2">
                  <Input readOnly value={joinLink} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copyJoinLink} title="Copy link">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <a
                  href={`mailto:?subject=Join ${encodeURIComponent(createdProject.name)} on Bild&body=${encodeURIComponent(`Join my project "${createdProject.name}" on Bild.\n\nUse this link: ${joinLink}\n\nOr enter this code: ${createdProject.join_code}`)}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="size-4" />
                  Email invite
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                <span>Project members: {members.length}</span>
              </div>
              {members.length > 0 && (
                <ul className="text-sm">
                  {members.map((m) => (
                    <li key={m.id}>• {m.full_name ?? "Unknown"}</li>
                  ))}
                </ul>
              )}
              <Button onClick={finishOnboarding} className="w-full">
                Go to dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
