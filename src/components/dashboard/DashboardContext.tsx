"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Project, ProjectMember } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface DashboardContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  createProject: (projectData: {
    name: string;
    description: string;
    category?: string;
    priority?: "High" | "Medium" | "Low";
  }) => Promise<Project>;
  deleteProject: (id: string) => Promise<boolean>;
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

const AVATAR_COLORS = [
  "bg-blue-600 text-white",
  "bg-purple-600 text-white",
  "bg-emerald-600 text-white",
  "bg-amber-600 text-white",
  "bg-rose-600 text-white",
  "bg-indigo-600 text-white",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface RawProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface RawMember {
  id: string;
  role: string;
  user_id: string;
  profiles: RawProfile | null;
}

interface RawTask {
  id: string;
  status: string;
}

interface RawProject {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  project_members?: RawMember[];
  tasks?: RawTask[];
}

export function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatProject = useCallback((row: RawProject): Project => {
    const rawTasks = row.tasks || [];
    const totalTasks = rawTasks.length;
    const completedTasks = rawTasks.filter((t) => t.status === "done").length;

    const status: "In Progress" | "Completed" | "Planning" =
      totalTasks > 0 && completedTasks === totalTasks
        ? "Completed"
        : totalTasks === 0
        ? "Planning"
        : "In Progress";

    const members: ProjectMember[] = (row.project_members || []).map((m) => {
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
        avatarBg: getAvatarColor(m.user_id),
        role: m.role,
      };
    });

    const createdDate = new Date(row.created_at);
    const dueDateFormatted = createdDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return {
      id: row.id,
      name: row.title,
      description: row.description || "No description provided.",
      category: "Workspace",
      status,
      priority: "Medium",
      totalTasks,
      completedTasks,
      dueDate: dueDateFormatted,
      members,
    };
  }, []);

  const fetchProjects = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
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
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const formatted = (data as unknown as RawProject[]).map(formatProject);
      setProjects(formatted);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load projects";
      console.error("Error fetching projects:", msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, supabase, formatProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (projectData: {
    name: string;
    description: string;
    category?: string;
    priority?: "High" | "Medium" | "Low";
  }): Promise<Project> => {
    if (!user) {
      throw new Error("You must be signed in to create a project.");
    }

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        title: projectData.name.trim(),
        description: projectData.description.trim() || "",
        owner_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Refresh projects list so triggers and memberships are fetched
    await fetchProjects();

    const createdDate = new Date(data.created_at);
    const dueDateFormatted = createdDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const userInitial = (
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "U"
    )
      .slice(0, 2)
      .toUpperCase();

    return {
      id: data.id,
      name: data.title,
      description: data.description || "",
      category: projectData.category || "Workspace",
      status: "Planning",
      priority: projectData.priority || "Medium",
      totalTasks: 0,
      completedTasks: 0,
      dueDate: dueDateFormatted,
      members: [
        {
          id: user.id,
          name: user.user_metadata?.full_name || user.email || "You",
          initials: userInitial,
          avatarBg: "bg-blue-600 text-white",
          role: "owner",
        },
      ],
    };
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const { error: delError } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (delError) {
        throw new Error(delError.message);
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err: unknown) {
      console.error("Error deleting project:", err);
      return false;
    }
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
        isLoading: authLoading || isLoading,
        error,
        refreshProjects: fetchProjects,
        createProject,
        deleteProject,
        getProjectById,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
