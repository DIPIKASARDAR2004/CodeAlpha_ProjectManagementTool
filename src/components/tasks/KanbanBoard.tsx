"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import { TaskItem } from "./TaskCard";
import { CreateTaskModal, ProjectMemberOption } from "./CreateTaskModal";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface KanbanBoardProps {
  projectId: string;
  onTaskStatsChange?: (total: number, completed: number) => void;
}

interface RawProjectMember {
  id: string;
  role: string;
  user_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export function KanbanBoard({
  projectId,
  onTaskStatsChange,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<ProjectMemberOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<
    "todo" | "in_progress" | "done"
  >("todo");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const supabase = createClient();

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync task statistics with parent header
  const notifyStats = useCallback(
    (currentTasks: TaskItem[]) => {
      if (onTaskStatsChange) {
        const total = currentTasks.length;
        const completed = currentTasks.filter((t) => t.status === "done").length;
        onTaskStatsChange(total, completed);
      }
    },
    [onTaskStatsChange]
  );

  // Fetch project tasks and verified project members
  const fetchData = useCallback(async () => {
    setError(null);
    try {
      // 1. Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(
          `
          *,
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .eq("project_id", projectId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });

      if (tasksError) throw new Error(tasksError.message);

      const loadedTasks = (tasksData as unknown as TaskItem[]) || [];
      setTasks(loadedTasks);
      notifyStats(loadedTasks);

      // 2. Fetch project members for assignee selection
      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select(
          `
          id,
          role,
          user_id,
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .eq("project_id", projectId);

      if (!membersError && membersData) {
        const rawMembers = membersData as unknown as RawProjectMember[];
        const formattedMembers: ProjectMemberOption[] = rawMembers.map((m) => {
          const p = m.profiles;
          const name = p?.full_name || p?.email?.split("@")[0] || "User";
          return {
            id: m.id,
            userId: m.user_id,
            name,
            role: m.role,
          };
        });
        setMembers(formattedMembers);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load task board";
      console.error("Error loading task board:", msg);
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId, supabase, notifyStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle moving task to a new status
  const handleMoveStatus = async (
    taskId: string,
    newStatus: "todo" | "in_progress" | "done"
  ) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === newStatus) return;

    // Optimistic UI update
    const prevTasks = [...tasks];
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);
    notifyStats(updatedTasks);

    const statusLabels = {
      todo: "To Do",
      in_progress: "In Progress",
      done: "Done",
    };
    showToast(`Task moved to "${statusLabels[newStatus]}"`);

    try {
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } catch (err: unknown) {
      // Rollback on failure
      setTasks(prevTasks);
      notifyStats(prevTasks);
      const msg = err instanceof Error ? err.message : "Failed to update task";
      setError(msg);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId: string) => {
    const prevTasks = [...tasks];
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    notifyStats(updatedTasks);
    showToast("Task deleted successfully");

    try {
      const { error: delError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (delError) {
        throw new Error(delError.message);
      }
    } catch (err: unknown) {
      setTasks(prevTasks);
      notifyStats(prevTasks);
      const msg = err instanceof Error ? err.message : "Failed to delete task";
      setError(msg);
    }
  };

  // Callback when a task is created via modal
  const handleTaskCreated = (newTask: TaskItem) => {
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    notifyStats(updatedTasks);
    showToast(`Task "${newTask.title}" created successfully!`);
  };

  // Callback when a task is updated in details modal
  const handleTaskUpdated = (updatedTask: TaskItem) => {
    const updatedTasks = tasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t
    );
    setTasks(updatedTasks);
    notifyStats(updatedTasks);
    setSelectedTask(updatedTask);
  };

  const handleOpenCreateModal = (
    status: "todo" | "in_progress" | "done" = "todo"
  ) => {
    setCreateInitialStatus(status);
    setIsCreateOpen(true);
  };

  const handleOpenDetails = (task: TaskItem) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  // Filter tasks into the 3 Kanban columns
  const todoTasks = useMemo(
    () => tasks.filter((t) => t.status === "todo"),
    [tasks]
  );
  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === "in_progress"),
    [tasks]
  );
  const doneTasks = useMemo(
    () => tasks.filter((t) => t.status === "done"),
    [tasks]
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-white p-4 shadow-xl text-xs sm:text-sm text-slate-800 animate-in fade-in slide-in-from-bottom-5"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="font-medium">{toast}</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 font-semibold underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Board Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Task Workflow</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag and drop cards or use quick action buttons to update deliverable states
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsRefreshing(true);
              fetchData();
            }}
            isLoading={isRefreshing}
            className="h-9 px-3 text-xs"
            title="Refresh tasks"
          >
            <RefreshCw className={isRefreshing ? "animate-spin h-3.5 w-3.5" : "h-3.5 w-3.5"} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenCreateModal("todo")}
            className="h-9 px-3.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban 3-Column Layout */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((col) => (
            <div
              key={col}
              className="rounded-2xl border border-slate-200 bg-slate-100/60 p-4 min-h-[460px] space-y-4"
            >
              <div className="h-6 w-32 bg-slate-200 rounded" />
              <div className="h-28 bg-white rounded-xl border border-slate-200" />
              <div className="h-28 bg-white rounded-xl border border-slate-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: To Do */}
          <KanbanColumn
            status="todo"
            title="To Do"
            tasks={todoTasks}
            onAddTask={handleOpenCreateModal}
            onMoveStatus={handleMoveStatus}
            onDeleteTask={handleDeleteTask}
            onSelectTask={handleOpenDetails}
            onDropTask={handleMoveStatus}
          />

          {/* Column 2: In Progress */}
          <KanbanColumn
            status="in_progress"
            title="In Progress"
            tasks={inProgressTasks}
            onAddTask={handleOpenCreateModal}
            onMoveStatus={handleMoveStatus}
            onDeleteTask={handleDeleteTask}
            onSelectTask={handleOpenDetails}
            onDropTask={handleMoveStatus}
          />

          {/* Column 3: Done */}
          <KanbanColumn
            status="done"
            title="Done"
            tasks={doneTasks}
            onAddTask={handleOpenCreateModal}
            onMoveStatus={handleMoveStatus}
            onDeleteTask={handleDeleteTask}
            onSelectTask={handleOpenDetails}
            onDropTask={handleMoveStatus}
          />
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={projectId}
        initialStatus={createInitialStatus}
        members={members}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdate={handleTaskUpdated}
        onDelete={handleDeleteTask}
        members={members}
      />
    </div>
  );
}

