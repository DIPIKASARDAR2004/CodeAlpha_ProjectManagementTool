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
  const isDashboard = activeItem ? activeItem === "dashboard" : pathname === "/dashboard";
  const isProjects = activeItem ? activeItem === "projects" : pathname.startsWith("/projects");

  const navigation = [
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
      href: "#",
      icon: CheckCircle2,
      current: false,
      badge: "Soon",
    },
    {
      name: "Team Members",
      href: "#",
      icon: Users,
      current: false,
      badge: "Soon",
    },
    {
      name: "Settings",
      href: "#",
      icon: Settings,
      current: false,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-6">
      {/* Top Header / Brand */}
      <div>
        <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <CheckSquare className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                TaskFlow
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider">
                WORKSPACE
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 space-y-1" aria-label="Sidebar navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isClickable = item.href !== "#";

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (mobileOpen) onCloseMobile();
                }}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 select-none",
                  item.current
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  !isClickable && "cursor-not-allowed opacity-75"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      item.current
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Mini Profile Card & Logout */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-xs text-white shadow-sm">
              AJ
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">
                Alex Johnson
              </p>
              <p className="truncate text-[11px] text-slate-500">
                alex@taskflow.dev
              </p>
            </div>
          </div>

          <Link
            href="/login"
            title="Sign out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 hover:shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Link>
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

