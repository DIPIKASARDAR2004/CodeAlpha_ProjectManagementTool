"use client";

import React, { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  KanbanSquare,
  Sparkles,
  Users,
  AlertCircle,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectWorkspacePage({ params }: PageProps) {
  const { projectId } = use(params);
  const { getProjectById } = useDashboard();

  const project = getProjectById(projectId);

  // Handle Invalid Project ID (Not-Found State)
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-200">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Project Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          We couldn&apos;t find a project with ID{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
            {projectId}
          </code>
          . It may have been removed or the link might be incorrect.
        </p>
        <div className="mt-6">
          <Link href="/dashboard">
            <Button variant="primary" size="md">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const percentage =
    project.totalTasks > 0
      ? Math.round((project.completedTasks / project.totalTasks) * 100)
      : 0;

  const statusStyles = {
    "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Planning: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const priorityStyles = {
    High: "text-amber-700 bg-amber-50 border-amber-200",
    Medium: "text-blue-700 bg-blue-50 border-blue-200",
    Low: "text-slate-700 bg-slate-50 border-slate-200",
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Breadcrumb Navigation & Back Link */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-medium hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400">Projects</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
          {project.name}
        </span>
      </nav>

      {/* Project Overview Header Card */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 max-w-3xl">
            {/* Status & Priority Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold",
                  statusStyles[project.status] || "bg-slate-50 text-slate-700"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {project.status}
              </span>

              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
                  priorityStyles[project.priority]
                )}
              >
                {project.priority} Priority
              </span>

              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {project.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {project.name}
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0 rounded-xl bg-slate-50 p-4 border border-slate-200/60 lg:min-w-[220px]">
            {/* Due Date */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 shadow-xs">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Due Date</p>
                <p className="font-semibold">{project.dueDate}</p>
              </div>
            </div>

            {/* Assigned Team */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 shadow-xs">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Team</p>
                <p className="font-semibold">{project.members.length} Members</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar & Members Row */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Task Progression
              </span>
              <span className="font-bold text-slate-900">
                {project.completedTasks} / {project.totalTasks} ({percentage}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Member Avatars */}
          <div className="flex items-center gap-3 md:justify-end">
            <span className="text-xs text-slate-500 font-medium">Contributors:</span>
            <div className="flex items-center -space-x-2">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  title={`${member.name} • ${member.role}`}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-white shadow-xs select-none transition-transform hover:scale-110 hover:z-10",
                    member.avatarBg
                  )}
                >
                  {member.initials}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Task Board Placeholder Section */}
      <section aria-labelledby="taskboard-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <KanbanSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 id="taskboard-heading" className="text-lg font-bold text-slate-900">
                Project Task Board
              </h2>
              <p className="text-xs text-slate-500">
                Manage task workflows across statuses
              </p>
            </div>
          </div>
        </div>

        {/* Feature Notice Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs sm:text-sm text-blue-900 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-950">
              Task Board Preview (Coming in Next Phase)
            </p>
            <p className="text-blue-800 text-xs leading-relaxed">
              Full interactive drag-and-drop Kanban task boards, priority labels, task assignments, and threaded team comments will be connected in the upcoming task management feature.
            </p>
          </div>
        </div>

        {/* 3 Kanban Column Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Column 1: To Do */}
          <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                To Do
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                3
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2">
                <span className="rounded bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold border border-amber-200">
                  High Priority
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  User onboarding & verification flow
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Due Soon
                  </span>
                  <div className="h-5 w-5 rounded-full bg-purple-600 text-[9px] font-bold text-white flex items-center justify-center">
                    SC
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2">
                <span className="rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold border border-blue-200">
                  Medium
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  Draft product launch release notes
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> In 5 days
                  </span>
                  <div className="h-5 w-5 rounded-full bg-amber-600 text-[9px] font-bold text-white flex items-center justify-center">
                    ED
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                In Progress
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                2
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2">
                <span className="rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold border border-blue-200">
                  Medium
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  Implement responsive navigation drawer
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-blue-600">
                    <Clock className="h-3 w-3" /> Active
                  </span>
                  <div className="h-5 w-5 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center">
                    AJ
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2">
                <span className="rounded bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[10px] font-semibold border border-rose-200">
                  Critical
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  Review database indexing strategy
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-blue-600">
                    <Clock className="h-3 w-3" /> Active
                  </span>
                  <div className="h-5 w-5 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center">
                    DK
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Done
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                4
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2">
                <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-semibold border border-emerald-200">
                  Completed
                </span>
                <p className="text-xs font-semibold text-slate-800 line-through text-slate-500">
                  Setup Next.js App Router repository
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="text-emerald-600 font-medium">✓ Verified</span>
                  <div className="h-5 w-5 rounded-full bg-emerald-600 text-[9px] font-bold text-white flex items-center justify-center">
                    MS
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2">
                <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-semibold border border-emerald-200">
                  Completed
                </span>
                <p className="text-xs font-semibold text-slate-800 line-through text-slate-500">
                  Create Sign In &amp; Sign Up pages
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="text-emerald-600 font-medium">✓ Verified</span>
                  <div className="h-5 w-5 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center">
                    AJ
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
