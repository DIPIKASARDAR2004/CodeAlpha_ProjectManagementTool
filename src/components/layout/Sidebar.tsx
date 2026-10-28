"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  LayoutDashboard,
  FolderKanban,
  CheckCircle2,
  Users,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeItem?: string;
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  activeItem,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  const isDashboard = activeItem ? activeItem === "dashboard" : pathname === "/dashboard";
  const isProjects = activeItem ? activeItem === "projects" : pathname.startsWith("/projects");
  const isTasks = activeItem ? activeItem === "tasks" : pathname === "/tasks";
  const isTeam = activeItem ? activeItem === "team" : pathname === "/team";
  const isSettings = activeItem ? activeItem === "settings" : pathname === "/settings";

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const displayEmail = profile?.email || user?.email || "Signed in";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const navigation: Array<{
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
    current: boolean;
    badge?: string;
  }> = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: isDashboard,
    },
    {
      name: "Projects",
      href: "/dashboard#projects",
      icon: FolderKanban,
      current: isProjects,
    },
    {
      name: "My Tasks",
      href: "/tasks",
      icon: CheckCircle2,
      current: isTasks,
    },
    {
      name: "Team",
      href: "/team",
      icon: Users,
      current: isTeam,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      current: isSettings,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 sm:p-5">
      {/* Brand & Main Navigation */}
      <div className="space-y-6">
        {/* Logo / Brand Header */}
        <div className="flex items-center justify-between px-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">TaskFlow</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-blue-600 -mt-1">
                Workspace
              </span>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1" aria-label="Sidebar Navigation">
          <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Menu
          </p>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  item.current
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      item.current
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 group-hover:bg-slate-200/60">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card & Logout */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-xs text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {displayEmail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 hover:shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200/80 bg-white shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-white transition-transform duration-300 ease-in-out lg:hidden shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
