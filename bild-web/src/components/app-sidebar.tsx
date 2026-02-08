"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, MessageSquare, FileText, Map, LogIn, LogOut, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/bob", label: "Bob", icon: MessageSquare },
  { href: "/files", label: "Files", icon: FileText },
];

function linkHref(href: string, projectId: string | null) {
  if (!projectId) return href;
  return `${href}${href.includes("?") ? "&" : "?"}project=${projectId}`;
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectIdFromQuery = searchParams.get("project");
  const projectIdFromPath = pathname.match(/^\/project\/([^/]+)/)?.[1] ?? null;
  const projectId = projectIdFromQuery ?? projectIdFromPath;
  const { user, profile, loading, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border flex flex-row items-center justify-between gap-2 px-2 py-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1">
        <Link href={linkHref("/", projectIdFromQuery)} className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:justify-center">
          <Image
            src="/icon.png"
            alt="Bild"
            width={28}
            height={28}
            className="size-7 shrink-0 object-contain"
          />
          <span className="font-bold text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">Bild</span>
        </Link>
        <SidebarTrigger className="shrink-0" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Home">
                  <Link href={linkHref("/", projectIdFromQuery)}>
                    <LayoutDashboard className="size-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.includes("/blueprint")}
                  tooltip="Blueprint"
                  className={!projectId ? "pointer-events-none opacity-50" : undefined}
                >
                  <Link href={projectId ? `/project/${projectId}/blueprint` : "#"}>
                    <Map className="size-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Blueprint</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {navItems.filter((item) => item.href !== "/").map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={linkHref(item.href, projectIdFromQuery)}>
                        <Icon className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border">
        {!loading && (
          <>
            {user ? (
              <div className="flex flex-col gap-1 p-2">
                <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    {profile?.full_name ?? user.email ?? "Signed in"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                  onClick={() => signOut()}
                >
                  <LogOut className="size-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Log out</span>
                </Button>
              </div>
            ) : (
              <SidebarMenuButton asChild>
                <Link
                  href="/login"
                  className="group-data-[collapsible=icon]:justify-center"
                >
                  <LogIn className="size-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Log in</span>
                </Link>
              </SidebarMenuButton>
            )}
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
