"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Users,
  AlertCircle,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { ManageMembersModal } from "@/components/projects/ManageMembersModal";
import { createClient } from "@/lib/supabase/client";
import { Project, ProjectMember } from "@/lib/mock-data";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectWorkspacePage({ params }: PageProps) {
  const { projectId } = use(params);
  const {
    getProjectById,
    isLoading: isDashboardLoading,
    refreshProjects,
  } = useDashboard();
  const [taskStats, setTaskStats] = useState<{
    total: number;
    completed: number;
  } | null>(null);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);

  const contextProject = getProjectById(projectId);
  const [directProject, setDirectProject] = useState<Project | null>(null);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [directFetchAttempted, setDirectFetchAttempted] = useState(false);

  const handleMembersUpdated = () => {
    refreshProjects();
    setDirectFetchAttempted(false);
  };

  // Fallback: If project not found in Dashboard context, fetch directly from Supabase
  useEffect(() => {
    if (!contextProject && !isDashboardLoading && !directFetchAttempted) {
      let isMounted = true;
      setIsDirectLoading(true);

      const fetchDirect = async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("projects")
            .select(
              `
              id,
              title,
              description,
              owner_id,
              created_at,
              updated_at,
              project_members (
                id,
                role,
                user_id,
                profiles (
                  id,
                  full_name,
                  avatar_url,
                  email
                )
              ),
              tasks (
                id,
                status
              )
            `
            )
            .eq("id", projectId)
            .single();

          if (!isMounted) return;

          if (!error && data) {
            const rawTasks = (data.tasks as Array<{ id: string; status: string }>) || [];
            const totalTasks = rawTasks.length;
            const completedTasks = rawTasks.filter((t) => t.status === "done").length;

            const status: "In Progress" | "Completed" | "Planning" =
              totalTasks > 0 && completedTasks === totalTasks
                ? "Completed"
                : totalTasks === 0
                ? "Planning"
                : "In Progress";

            interface RawMember {
              id: string;
              role: string;
              user_id: string;
              profiles: {
                id: string;
                full_name: string | null;
                avatar_url: string | null;
                email: string | null;
              } | null;
            }

            const rawMembers = (data.project_members as unknown as RawMember[]) || [];
            const members: ProjectMember[] = rawMembers.map((m) => {
              const p = m.profiles;
              const name = p?.full_name || p?.email?.split("@")[0] || "User";
              const initials =
                name
                  .split(" ")
                  .map((n: string) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "U";

              return {
                id: m.id,
                name,
                initials,
                avatarBg: "bg-blue-600 text-white",
                role: m.role,
              };
            });

            const createdDate = new Date(data.created_at);
            const dueDateFormatted = createdDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            setDirectProject({
              id: data.id,
              name: data.title,
              description: data.description || "No description provided.",
              category: "Workspace",
              status,
              priority: "Medium",
              totalTasks,
              completedTasks,
              dueDate: dueDateFormatted,
              members,
            });
          }
        } catch (err) {
          console.error("Direct project fetch error:", err);
        } finally {
          if (isMounted) {
            setIsDirectLoading(false);
            setDirectFetchAttempted(true);
          }
        }
      };

      fetchDirect();

      return () => {
        isMounted = false;
      };
    }
  }, [contextProject, isDashboardLoading, directFetchAttempted, projectId]);

  const project = contextProject || directProject;
  const isLoading = isDashboardLoading || (isDirectLoading && !project);

  // Show Loading Skeleton while project is being fetched
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse pb-12">
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="rounded-2xl border border-slate-200 bg-white p-8 h-48 space-y-4">
          <div className="h-6 w-1/3 bg-slate-200 rounded" />
          <div className="h-4 w-2/3 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((col) => (
            <div key={col} className="rounded-2xl border border-slate-200 bg-white p-5 h-72 space-y-3">
              <div className="h-5 w-24 bg-slate-200 rounded" />
              <div className="h-20 bg-slate-50 rounded-xl border border-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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

  const totalTasks = taskStats !== null ? taskStats.total : project.totalTasks;
  const completedTasks =
    taskStats !== null ? taskStats.completed : project.completedTasks;
  const percentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
                {completedTasks} / {totalTasks} ({percentage}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Member Avatars & Manage Team Button */}
          <div className="flex items-center gap-3 md:justify-end flex-wrap">
            <div className="flex items-center gap-2">
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManageMembersOpen(true)}
              className="h-8 px-2.5 text-xs font-semibold gap-1.5"
            >
              <Users className="h-3.5 w-3.5 text-blue-600" />
              <span>Manage Team</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Live Kanban Task Board */}
      <section aria-labelledby="taskboard-heading" className="space-y-4">
        <KanbanBoard
          projectId={projectId}
          onTaskStatsChange={(total, completed) =>
            setTaskStats({ total, completed })
          }
        />
      </section>

      {/* Manage Team Members Modal */}
      <ManageMembersModal
        isOpen={isManageMembersOpen}
        onClose={() => setIsManageMembersOpen(false)}
        projectId={projectId}
        projectName={project.name}
        onMembersUpdated={handleMembersUpdated}
      />
    </div>
  );
}
