"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  FolderKanban,
  ShieldCheck,
  Shield,
  User,
  Mail,
  RefreshCw,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface RawMemberRecord {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  projects: {
    id: string;
    title: string;
  } | null;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface TeamMemberSummary {
  userId: string;
  name: string;
  email: string;
  initials: string;
  highestRole: "owner" | "admin" | "member";
  projects: Array<{ id: string; title: string; role: string }>;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchTeam = useCallback(async () => {
    if (!user) return;
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("project_members")
        .select(
          `
          id,
          project_id,
          user_id,
          role,
          joined_at,
          projects (
            id,
            title
          ),
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .order("joined_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const raw = (data as unknown as RawMemberRecord[]) || [];

      // Group by user_id
      const memberMap = new Map<string, TeamMemberSummary>();

      raw.forEach((item) => {
        const uId = item.user_id;
        const p = item.profiles;
        const name = p?.full_name || p?.email?.split("@")[0] || "User";
        const email = p?.email || "No email available";

        const initials =
          name
            .split(" ")
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "U";

        const existing = memberMap.get(uId);

        const projectItem = item.projects
          ? { id: item.projects.id, title: item.projects.title, role: item.role }
          : null;

        if (!existing) {
          memberMap.set(uId, {
            userId: uId,
            name,
            email,
            initials,
            highestRole: (item.role as "owner" | "admin" | "member") || "member",
            projects: projectItem ? [projectItem] : [],
          });
        } else {
          if (projectItem && !existing.projects.some((pr) => pr.id === projectItem.id)) {
            existing.projects.push(projectItem);
          }
          if (item.role === "owner") existing.highestRole = "owner";
          else if (item.role === "admin" && existing.highestRole !== "owner") {
            existing.highestRole = "admin";
          }
        }
      });

      // Sort so current user is first, then alphabetical
      const memberList = Array.from(memberMap.values()).sort((a, b) => {
        if (a.userId === user.id) return -1;
        if (b.userId === user.id) return 1;
        return a.name.localeCompare(b.name);
      });

      setMembers(memberList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load team directory";
      console.error("Error loading team:", msg);
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.projects.some((p) => p.title.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse pb-12">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 p-6" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Team Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Collaborators, roles, and project assignments across your TaskFlow workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsRefreshing(true);
              fetchTeam();
            }}
            isLoading={isRefreshing}
            className="text-xs h-9 px-3 gap-1.5"
          >
            <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            <span>Refresh</span>
          </Button>

          <Link href="/dashboard">
            <Button variant="primary" size="sm" className="text-xs h-9 px-3.5 gap-1.5 shadow-xs">
              <FolderKanban className="h-4 w-4" />
              <span>Projects</span>
            </Button>
          </Link>
        </div>
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

      {/* Search Input Bar */}
      <div className="w-full max-w-md relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search teammates by name, email, or project..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        />
      </div>

      {/* Team Member Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center animate-in fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 ring-8 ring-blue-50/50">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchQuery ? "No matching teammates found" : "No collaborators added yet"}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-md leading-relaxed">
            {searchQuery
              ? `No teammates matched "${searchQuery}". Try searching with a different term.`
              : "To invite team members to your workspaces, open any project board and click 'Manage Team' in the header."}
          </p>
          <div className="mt-6">
            <Link href="/dashboard">
              <Button variant="primary" size="md" className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Open a Project to Invite Members</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const isMe = member.userId === user?.id;

            return (
              <div
                key={member.userId}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all space-y-4"
              >
                {/* Top Info */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-xs select-none">
                    {member.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {member.name}
                      </h3>
                      {isMe && (
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          You
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </p>

                    <div className="pt-2">
                      {member.highestRole === "owner" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          <ShieldCheck className="h-3 w-3" />
                          Project Owner
                        </span>
                      ) : member.highestRole === "admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          <Shield className="h-3 w-3" />
                          Project Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          <User className="h-3 w-3 text-slate-400" />
                          Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shared Projects List */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Collaborating On ({member.projects.length})
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {member.projects.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No shared projects</span>
                    ) : (
                      member.projects.map((proj) => (
                        <Link
                          key={proj.id}
                          href={`/projects/${proj.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                        >
                          <FolderKanban className="h-3 w-3 text-slate-400" />
                          <span className="truncate max-w-[140px]">{proj.title}</span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

