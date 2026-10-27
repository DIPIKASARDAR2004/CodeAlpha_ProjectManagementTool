"use client";

import React from "react";
import { Menu, Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DashboardHeaderProps {
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenCreateModal: () => void;
}

export function DashboardHeader({
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile Hamburger Button */}
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search Input Bar */}
      <div className="flex flex-1 items-center">
        <div className="w-full max-w-md relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects, tasks, or team..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
      </div>

      {/* Right Controls: Notifications & New Project Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Create Project Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateModal}
          className="h-9 px-3 sm:px-4 text-xs sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Project</span>
        </Button>

        {/* Notifications Icon (Mock) */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Notifications"
          title="Notifications (0 unread)"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
        </button>

        {/* User Avatar Placeholder */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shadow-xs cursor-pointer ring-2 ring-blue-100"
          title="Alex Johnson (Product Lead)"
        >
          AJ
        </div>
      </div>
    </header>
  );
}

