"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  FolderKanban,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AssignedTask {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
  project_id: string;
  projects: {
    id: string;
    title: string;
  } | null;
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "todo" | "in_progress" | "done"
  >("all");

  const supabase = createClient();

  const fetchMyTasks = useCallback(async () => {
    if (!user) return;
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          description,
          status,
          priority,
          due_date,
          created_at,
          project_id,
          projects (
            id,
            title
          )
        `
        )
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setTasks((data as unknown as AssignedTask[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load assigned tasks";
      console.error("Error fetching tasks:", msg);
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // Quick Status Transition
  const handleQuickStatusChange = async (
    taskId: string,
    newStatus: "todo" | "in_progress" | "done"
  ) => {
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } catch {
      setTasks(prevTasks);
    }
  };

  // Metrics
  const totalAssigned = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const overdueCount = tasks.filter(
    (t) =>
      t.due_date &&
      t.status !== "done" &&
      new Date(t.due_date).getTime() < Date.now()
  ).length;

  // Filtered Task List
  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  const priorityStyles = {
    high: "bg-rose-50 text-rose-700 border-rose-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const statusStyles = {
    todo: "bg-slate-100 text-slate-700 border-slate-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const statusLabels = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Completed",
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse pb-12">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 p-4" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            My Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            All deliverables assigned to you across your projects in one unified view.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsRefreshing(true);
            fetchMyTasks();
          }}
          isLoading={isRefreshing}
          className="text-xs h-9 px-3 self-start sm:self-auto gap-1.5"
        >
          <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-center gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Assigned Deliverables</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalAssigned}</span>
            <span className="text-xs text-slate-500">tasks total</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">In Progress</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{inProgressCount}</span>
            <span className="text-xs text-amber-600 font-medium">active right now</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{completedCount}</span>
            <span className="text-xs text-emerald-600 font-medium">finished</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Overdue Alerts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{overdueCount}</span>
            <span className="text-xs text-rose-600 font-medium">need attention</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {(["all", "todo", "in_progress", "done"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors capitalize",
              statusFilter === filter
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            {filter === "all" ? "All Tasks" : filter === "in_progress" ? "In Progress" : filter === "todo" ? "To Do" : "Completed"}
            <span className="ml-1.5 opacity-80">
              (
              {filter === "all"
                ? tasks.length
                : tasks.filter((t) => t.status === filter).length}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Task List / Table */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center animate-in fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 ring-8 ring-blue-50/50">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {statusFilter === "all"
              ? "No tasks assigned to you yet"
              : `No tasks found in "${statusFilter}"`}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-md leading-relaxed">
            {statusFilter === "all"
              ? "When project owners assign you deliverables in any project Kanban board, they will show up here."
              : "Try switching to another tab or open your projects to see active deliverables."}
          </p>
          <div className="mt-6">
            <Link href="/dashboard">
              <Button variant="primary" size="md" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                <span>Go to Projects Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const formattedDueDate = task.due_date
              ? new Date(task.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null;

            const isOverdue =
              task.due_date &&
              task.status !== "done" &&
              new Date(task.due_date).getTime() < Date.now();

            const projectName = task.projects?.title || "Project Workspace";

            return (
              <div
                key={task.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {/* Left Task Info */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Project Chip */}
                    <Link
                      href={`/projects/${task.project_id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      title="Open project board"
                    >
                      <FolderKanban className="h-3 w-3" />
                      <span>{projectName}</span>
                    </Link>

                    {/* Status Badge */}
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                        statusStyles[task.status]
                      )}
                    >
                      {statusLabels[task.status]}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize",
                        priorityStyles[task.priority]
                      )}
                    >
                      {task.priority} Priority
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Right Actions & Due Date */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Due Date */}
                  {formattedDueDate ? (
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium",
                        isOverdue ? "text-rose-600" : "text-slate-500"
                      )}
                    >
                      {isOverdue ? (
                        <AlertCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5" />
                      )}
                      <span>{formattedDueDate}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No deadline</span>
                  )}

                  {/* Status Toggle Button */}
                  {task.status !== "done" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStatusChange(task.id, "done")}
                      className="text-xs h-8 px-3 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      <span>Mark Done</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStatusChange(task.id, "in_progress")}
                      className="text-xs h-8 px-3 text-slate-600 border-slate-200 hover:bg-slate-100"
                    >
                      <span>Reopen</span>
                    </Button>
                  )}

                  {/* Open Project Link */}
                  <Link
                    href={`/projects/${task.project_id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Open in project workspace"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

