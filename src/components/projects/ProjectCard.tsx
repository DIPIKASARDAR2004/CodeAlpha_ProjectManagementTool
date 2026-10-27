"use client";

import React from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, MoreVertical } from "lucide-react";
import { Project } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  href?: string;
  onClick?: () => void;
}

export function ProjectCard({ project, href, onClick }: ProjectCardProps) {
  const percentage =
    project.totalTasks > 0
      ? Math.round((project.completedTasks / project.totalTasks) * 100)
      : 0;

  const isCompleted = percentage === 100 || project.status === "Completed";
  const projectLink = href || `/projects/${project.id}`;

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
    <article
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 cursor-pointer",
        "hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      {/* Accessible Primary Stretched Link */}
      <Link
        href={projectLink}
        className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        aria-label={`Open project ${project.name}`}
      />

      {/* Top Meta: Status Badge, Priority & Actions */}
      <div className="relative z-10 pointer-events-none">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                statusStyles[project.status] || "bg-slate-50 text-slate-700"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isCompleted ? "bg-emerald-500" : "bg-blue-500"
                )}
              />
              {project.status}
            </span>

            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
                priorityStyles[project.priority]
              )}
            >
              {project.priority} Priority
            </span>
          </div>

          {/* Action button isolated from card link */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="pointer-events-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Options for ${project.name}`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Project Title & Category */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {project.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-400">
          {project.category}
        </p>

        {/* Description */}
        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
          {project.description}
        </p>
      </div>

      {/* Progress & Bottom Meta */}
      <div className="relative z-10 pointer-events-none mt-6 pt-4 border-t border-slate-100 space-y-4">
        {/* Progress Bar & Counts */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <CheckCircle2
                className={cn(
                  "h-3.5 w-3.5",
                  isCompleted ? "text-emerald-600" : "text-blue-600"
                )}
              />
              <span>
                {project.completedTasks} / {project.totalTasks} tasks completed
              </span>
            </span>
            <span
              className={cn(
                "font-bold",
                isCompleted ? "text-emerald-600" : "text-slate-900"
              )}
            >
              {percentage}%
            </span>
          </div>

          {/* Visual Progress Track */}
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isCompleted
                  ? "bg-emerald-500"
                  : percentage > 50
                  ? "bg-blue-600"
                  : "bg-blue-500"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Members Avatar Stack & Due Date */}
        <div className="flex items-center justify-between pt-1">
          {/* Member Initials Avatar Stack */}
          <div className="flex items-center -space-x-2 overflow-hidden pointer-events-auto">
            {project.members.map((member) => (
              <div
                key={member.id}
                title={`${member.name} (${member.role})`}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ring-2 ring-white select-none shadow-xs transition-transform hover:scale-110 hover:z-20",
                  member.avatarBg
                )}
              >
                {member.initials}
              </div>
            ))}
          </div>

          {/* Due Date Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{project.dueDate}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
