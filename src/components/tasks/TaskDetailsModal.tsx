"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { TaskItem } from "./TaskCard";
import { ProjectMemberOption } from "./CreateTaskModal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { TaskCommentSection } from "./TaskCommentSection";

interface TaskDetailsModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: TaskItem) => void;
  onDelete: (taskId: string) => void;
  members: ProjectMemberOption[];
}

export function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  members,
}: TaskDetailsModalProps) {
  const [status, setStatus] = useState<"todo" | "in_progress" | "done">("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  React.useEffect(() => {
    if (task) {
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedTo(task.assigned_to || "");
      setError(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleStatusChange = async (newStatus: "todo" | "in_progress" | "done") => {
    setIsUpdating(true);
    setError(null);
    try {
      const { data, error: updateError } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", task.id)
        .select(
          `
          *,
          profiles:assigned_to (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .single();

      if (updateError) throw new Error(updateError.message);
      setStatus(newStatus);
      onUpdate(data as unknown as TaskItem);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: "low" | "medium" | "high") => {
    setIsUpdating(true);
    setError(null);
    try {
      const { data, error: updateError } = await supabase
        .from("tasks")
        .update({ priority: newPriority })
        .eq("id", task.id)
        .select(
          `
          *,
          profiles:assigned_to (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .single();

      if (updateError) throw new Error(updateError.message);
      setPriority(newPriority);
      onUpdate(data as unknown as TaskItem);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update priority";
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssigneeChange = async (newAssignee: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      const val = newAssignee.trim() ? newAssignee.trim() : null;
      const { data, error: updateError } = await supabase
        .from("tasks")
        .update({ assigned_to: val })
        .eq("id", task.id)
        .select(
          `
          *,
          profiles:assigned_to (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .single();

      if (updateError) throw new Error(updateError.message);
      setAssignedTo(newAssignee);
      onUpdate(data as unknown as TaskItem);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update assignee";
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No deadline specified";

  const formattedCreatedDate = new Date(task.created_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-7 shadow-xl border border-slate-200 transition-all z-10 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                status === "todo" && "bg-slate-100 text-slate-700",
                status === "in_progress" && "bg-blue-50 text-blue-700",
                status === "done" && "bg-emerald-50 text-emerald-700"
              )}
            >
              {status === "in_progress"
                ? "In Progress"
                : status === "done"
                ? "Done"
                : "To Do"}
            </span>
            <h2
              id="task-detail-title"
              className="text-xl font-bold text-slate-900 leading-snug pt-1"
            >
              {task.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Description Section */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Description
          </h3>
          <p className="text-sm text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
            {task.description || "No description provided for this task."}
          </p>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Workflow Status
            </label>
            <select
              value={status}
              disabled={isUpdating}
              onChange={(e) =>
                handleStatusChange(
                  e.target.value as "todo" | "in_progress" | "done"
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Priority
            </label>
            <select
              value={priority}
              disabled={isUpdating}
              onChange={(e) =>
                handlePriorityChange(
                  e.target.value as "low" | "medium" | "high"
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Assignee Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Assigned Member
            </label>
            <select
              value={assignedTo}
              disabled={isUpdating}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Info */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Due Date
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-700">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="truncate">{formattedDueDate}</span>
            </div>
          </div>
        </div>

        {/* Activity & Threaded Comments */}
        <TaskCommentSection taskId={task.id} />

        {/* Footer info: creation date & delete action */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400">
          <p>Created on {formattedCreatedDate}</p>

          <button
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to delete this task?")) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold transition-colors focus:outline-none"
          >
            <Trash2 className="h-4 w-4" />
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}

