"use client";

import React, { useState } from "react";
import { Plus, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { TaskCard, TaskItem } from "./TaskCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: "todo" | "in_progress" | "done";
  title: string;
  tasks: TaskItem[];
  onAddTask: (status: "todo" | "in_progress" | "done") => void;
  onMoveStatus: (taskId: string, newStatus: "todo" | "in_progress" | "done") => void;
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (task: TaskItem) => void;
  onDropTask: (taskId: string, targetStatus: "todo" | "in_progress" | "done") => void;
}

export function KanbanColumn({
  status,
  title,
  tasks,
  onAddTask,
  onMoveStatus,
  onDeleteTask,
  onSelectTask,
  onDropTask,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const columnConfig = {
    todo: {
      icon: ListTodo,
      badge: "bg-slate-200 text-slate-700",
      accent: "border-t-blue-500",
      borderHover: "border-blue-400 bg-blue-50/20",
    },
    in_progress: {
      icon: Clock,
      badge: "bg-blue-100 text-blue-700",
      accent: "border-t-amber-500",
      borderHover: "border-amber-400 bg-amber-50/20",
    },
    done: {
      icon: CheckCircle2,
      badge: "bg-emerald-100 text-emerald-700",
      accent: "border-t-emerald-500",
      borderHover: "border-emerald-400 bg-emerald-50/20",
    },
  };

  const config = columnConfig[status];
  const Icon = config.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only leave if not entering a child element
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col rounded-2xl bg-slate-100/70 border border-slate-200/80 p-4 transition-all duration-200 min-h-[480px]",
        config.accent,
        "border-t-4",
        isDragOver && cn("ring-2 ring-blue-500/50 shadow-md", config.borderHover)
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <h3 className="font-bold text-sm text-slate-800">{title}</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              config.badge
            )}
          >
            {tasks.length}
          </span>
        </div>

        {/* Add Task Button Shortcut */}
        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={`Add task to ${title}`}
          aria-label={`Add task to ${title}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Task Cards Stack */}
      <div className="flex-1 space-y-3 overflow-y-auto py-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onMoveStatus={onMoveStatus}
            onDelete={onDeleteTask}
            onClick={() => onSelectTask(task)}
          />
        ))}

        {/* Empty Lane State */}
        {tasks.length === 0 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 py-10 px-4 text-center transition-colors",
              isDragOver ? "bg-blue-50/50 border-blue-400" : "bg-white/40"
            )}
          >
            <p className="text-xs text-slate-400 font-medium">
              {isDragOver ? "Drop task here" : "No tasks in this lane"}
            </p>
            <button
              type="button"
              onClick={() => onAddTask(status)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

