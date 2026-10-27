"use client";

import React, { createContext, useContext, useState } from "react";
import { INITIAL_PROJECTS, Project, MOCK_MEMBERS } from "@/lib/mock-data";

interface DashboardContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  projects: Project[];
  createProject: (projectData: {
    name: string;
    description: string;
    category: string;
    priority: "High" | "Medium" | "Low";
  }) => Project;
  getProjectById: (id: string) => Project | undefined;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

export function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);

  const createProject = (projectData: {
    name: string;
    description: string;
    category: string;
    priority: "High" | "Medium" | "Low";
  }): Project => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectData.name,
      description: projectData.description,
      category: projectData.category,
      status: "In Progress",
      priority: projectData.priority,
      totalTasks: 5,
      completedTasks: 0,
      dueDate: "Dec 15, 2026",
      members: [MOCK_MEMBERS.alex, MOCK_MEMBERS.sarah],
    };

    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };

  const getProjectById = (id: string): Project | undefined => {
    return projects.find((p) => p.id === id);
  };

  return (
    <DashboardContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        isCreateModalOpen,
        setIsCreateModalOpen,
        projects,
        createProject,
        getProjectById,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
