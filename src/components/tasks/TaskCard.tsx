"use client";

import React from "react";
import {
  Calendar,
  MoreVertical,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskAssignee {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface TaskItem {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigned_to: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  profiles?: TaskAssignee | null;
  comments?: Array<{ id: string }> | null;
}

interface TaskCardProps {
  task: TaskItem;
  onMoveStatus: (taskId: string, newStatus: "todo" | "in_progress" | "done") => void;
  onDelete: (taskId: string) => void;
  onClick: () => void;
}

export function TaskCard({
  task,
  onMoveStatus,
  onDelete,
  onClick,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  const priorityConfig = {
    high: {
      label: "High",
      className: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
    },
    medium: {
      label: "Medium",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },
    low: {
      label: "Low",
      className: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
    },
  };

  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  const assigneeName =
    task.profiles?.full_name ||
    task.profiles?.email?.split("@")[0] ||
    "Unassigned";

  const assigneeInitials =
    task.profiles
      ? (
          task.profiles.full_name ||
          task.profiles.email?.split("@")[0] ||
          "U"
        )
          .split(" ")
          .map((n) => n[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : null;

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isOverdue =
    task.due_date &&
    task.status !== "done" &&
    new Date(task.due_date).getTime() < Date.now();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group relative rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 hover:shadow-md cursor-grab active:cursor-grabbing",
        task.status === "done" && "bg-slate-50/60 border-slate-200/60"
      )}
      onClick={onClick}
    >
      {/* Top Meta: Priority & Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
            priority.className
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
          {priority.label}
        </span>

        {/* Dropdown Menu Toggle */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-60 group-hover:opacity-100 transition-opacity"
            aria-label="Task options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-40 text-xs animate-in fade-in zoom-in-95">
                {task.status !== "todo" && (
                  <button
                    type="button"
                    onClick={() => {
                      onMoveStatus(task.id, "todo");
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
                    Move to To Do
                  </button>
                )}
                {task.status !== "in_progress" && (
                  <button
                    type="button"
                    onClick={() => {
                      onMoveStatus(task.id, "in_progress");
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    Move to In Progress
                  </button>
                )}
                {task.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => {
                      onMoveStatus(task.id, "done");
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Mark as Done
                  </button>
                )}
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this task?")) {
                      onDelete(task.id);
                    }
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4
        className={cn(
          "text-sm font-semibold text-slate-900 leading-snug line-clamp-2",
          task.status === "done" && "line-through text-slate-400"
        )}
      >
        {task.title}
      </h4>

      {/* Task Description Preview */}
      {task.description && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer Info: Due Date & Assignee Avatar */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        {/* Due Date & Comments Indicator */}
        <div className="flex items-center gap-2.5">
          {formattedDueDate ? (
            <div
              className={cn(
                "flex items-center gap-1.5 font-medium",
                isOverdue ? "text-rose-600" : "text-slate-500"
              )}
              title={isOverdue ? "Overdue" : "Due date"}
            >
              {isOverdue ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <Calendar className="h-3.5 w-3.5" />
              )}
              <span className="text-[11px]">{formattedDueDate}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">No due date</span>
          )}

          {task.comments && task.comments.length > 0 && (
            <div
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
              title={`${task.comments.length} comment${task.comments.length > 1 ? "s" : ""}`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar & Name Indicator */}
        {assigneeInitials ? (
          <div
            className="flex items-center gap-1.5 min-w-0 max-w-[130px]"
            title={`Assigned to ${assigneeName}`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-2xs ring-1 ring-white select-none">
              {assigneeInitials}
            </div>
            <span className="text-[11px] font-medium text-slate-700 truncate">
              {assigneeName}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Unassigned</span>
        )}
      </div>

      {/* Quick Move Shortcut on Hover */}
      <div
        className="mt-2.5 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {task.status === "todo" && (
          <button
            type="button"
            onClick={() => onMoveStatus(task.id, "in_progress")}
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Start Task
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        {task.status === "in_progress" && (
          <button
            type="button"
            onClick={() => onMoveStatus(task.id, "done")}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Complete
            <CheckCircle2 className="h-3 w-3" />
          </button>
        )}
        {task.status === "done" && (
          <button
            type="button"
            onClick={() => onMoveStatus(task.id, "in_progress")}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Reopen
          </button>
        )}
      </div>
    </div>
  );
}

