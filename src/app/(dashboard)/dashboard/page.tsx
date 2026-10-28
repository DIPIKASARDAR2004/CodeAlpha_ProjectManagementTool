"use client";

import React, { useState, useMemo } from "react";
import {
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  Users,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const {
    searchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    projects,
    isLoading,
    createProject,
  } = useDashboard();

  const { user, profile } = useAuth();

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "In Progress" | "Completed"
  >("ALL");
  const [notification, setNotification] = useState<string | null>(null);

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  // Compute filtered projects based on header search and status filter
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "ALL" || project.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        project.name.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        project.category.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [projects, statusFilter, searchQuery]);

  // Aggregate live metrics
  const activeCount = projects.filter((p) => p.status === "In Progress").length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;
  const totalTasks = projects.reduce((acc, p) => acc + p.totalTasks, 0);
  const completedTasks = projects.reduce((acc, p) => acc + p.completedTasks, 0);
  const overallProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalMembersCount = useMemo(() => {
    const ids = new Set<string>();
    projects.forEach((p) => p.members?.forEach((m) => ids.add(m.name)));
    return ids.size > 0 ? ids.size : 1;
  }, [projects]);

  // Handle new project creation
  const handleCreateProject = async (newProjectData: {
    name: string;
    description: string;
    category: string;
    priority: "High" | "Medium" | "Low";
  }) => {
    const newProject = await createProject(newProjectData);
    setNotification(
      `Project "${newProject.name}" has been created! Click the card to open its workspace.`
    );

    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50/95 p-4 text-xs sm:text-sm text-blue-900 shadow-sm flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
            <p className="font-medium">{notification}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-blue-500 hover:text-blue-700 text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Welcome & KPI Metrics */}
      <section aria-labelledby="overview-heading" className="space-y-4">
        <div>
          <h1
            id="overview-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your team&apos;s active deliverables and project performance.
          </p>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Projects */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Total Projects
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FolderKanban className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {projects.length}
              </span>
              <span className="text-xs text-slate-500">
                ({activeCount} in progress)
              </span>
            </div>
          </div>

          {/* Card 2: Completed Tasks */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Tasks Completed
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {completedTasks}
              </span>
              <span className="text-xs text-slate-500">
                of {totalTasks} tasks
              </span>
            </div>
          </div>

          {/* Card 3: Overall Completion Rate */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Completion Rate
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {overallProgress}%
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                {overallProgress === 100 && totalTasks > 0
                  ? "All done"
                  : "On track"}
              </span>
            </div>
          </div>

          {/* Card 4: Team Members */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Team Contributors
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {totalMembersCount}
              </span>
              <span className="text-xs text-slate-500">
                {totalMembersCount === 1 ? "member" : "members"} active
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* "My Projects" Section */}
      <section id="projects" className="space-y-5 pt-2">
        {/* Section Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              My Projects
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review deliverables, monitor task progression, and manage teams. Click any card to open its workspace.
            </p>
          </div>

          {/* Create Project Button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </Button>
        </div>

        {/* Filter Controls: Status Tabs & Result Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["ALL", "In Progress", "Completed"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all select-none whitespace-nowrap cursor-pointer",
                  statusFilter === status
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                )}
              >
                {status === "ALL" ? `All (${projects.length})` : status}
                {status === "In Progress" && ` (${activeCount})`}
                {status === "Completed" && ` (${completedCount})`}
              </button>
            ))}
          </div>

          {/* Search Result Counter */}
          <div className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredProjects.length}
            </span>{" "}
            of {projects.length} projects
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-200 bg-white p-6 h-64 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded-full w-16" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
                <div className="h-2 bg-slate-100 rounded-full mt-6" />
                <div className="flex justify-between items-center pt-4">
                  <div className="flex -space-x-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200" />
                    <div className="h-7 w-7 rounded-full bg-slate-300" />
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          /* Project Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* Zero Projects Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center animate-in fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 ring-8 ring-blue-50/50">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No projects created yet
            </h3>
            <p className="mt-1.5 text-sm text-slate-500 max-w-md leading-relaxed">
              Welcome to TaskFlow! Get started by creating your first project workspace to organize tasks, assign teammates, and track milestones.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateModalOpen(true)}
                className="shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Project</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Search / Filter Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No matching projects found
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {searchQuery
                ? `No projects match "${searchQuery}". Try searching with a different term.`
                : "No projects match the selected filter."}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("ALL")}
              >
                Reset Filter
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create New Project
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
