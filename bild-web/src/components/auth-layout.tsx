"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderWithProjectSelector } from "@/components/header-with-project-selector";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";
  const isOnboardingPage = pathname === "/onboarding";
  const isJoinPage = pathname === "/join";
  const isPresentationPage = pathname === "/presentation";
  const isBobPage = pathname?.startsWith("/bob") ?? false;
  const needsOnboarding = user && profile && profile.onboarding_completed_at == null;

  useEffect(() => {
    if (loading) return;
    if (isPresentationPage) return; // Presentation is public, no redirect
    if (isLoginPage && user) {
      if (needsOnboarding) router.replace("/onboarding");
      else router.replace("/");
      return;
    }
    if (isSignupPage && user) {
      router.replace("/onboarding");
      return;
    }
    if (needsOnboarding && !isOnboardingPage) {
      router.replace("/onboarding");
      return;
    }
    // Don't redirect to login when on Bob or Join — they show their own sign-in prompt
    if (!isLoginPage && !isSignupPage && !isOnboardingPage && !isJoinPage && !isPresentationPage && !user && !isBobPage) {
      router.replace("/login");
    }
  }, [loading, user, profile, needsOnboarding, isLoginPage, isSignupPage, isOnboardingPage, isJoinPage, isPresentationPage, isBobPage, router]);

  // Login, signup, onboarding, join, presentation: no sidebar, just the page content (full width)
  if (isLoginPage || isSignupPage || isOnboardingPage || isJoinPage || isPresentationPage) {
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  // Not logged in and not on login/signup/onboarding/join (and not on Bob): show loading until redirect
  if (!user && !isBobPage && !isJoinPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Logged in: full app with sidebar and header
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderWithProjectSelector />
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
