"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  User,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface ProjectMemberDetail {
  id: string; // project_members record id
  project_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profiles: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onMembersUpdated?: () => void;
}

export function ManageMembersModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onMembersUpdated,
}: ManageMembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<ProjectMemberDetail[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
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
          profiles (
            id,
            email,
            full_name,
            avatar_url
          )
        `
        )
        .eq("project_id", projectId)
        .order("joined_at", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setMembers((data as unknown as ProjectMemberDetail[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load project members";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, supabase]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      setSuccess(null);
      setError(null);
    }
  }, [isOpen, fetchMembers]);

  if (!isOpen) return null;

  // Determine current user's role in this project
  const currentMember = members.find((m) => m.user_id === user?.id);
  const canManage =
    currentMember?.role === "owner" || currentMember?.role === "admin";
  const isOwner = currentMember?.role === "owner";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToInvite = inviteEmail.trim().toLowerCase();
    if (!emailToInvite || !canManage) return;

    setIsInviting(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Look up profile by email
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", emailToInvite)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profileData) {
        throw new Error(
          `No registered user found with email "${emailToInvite}". Ask them to create a TaskFlow account first.`
        );
      }

      // 2. Check if already a member
      const alreadyMember = members.some((m) => m.user_id === profileData.id);
      if (alreadyMember) {
        throw new Error(`"${emailToInvite}" is already a member of this project.`);
      }

      // 3. Add to project_members
      const { error: insertError } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: profileData.id,
          role: inviteRole,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(`Added ${profileData.full_name || emailToInvite} as ${inviteRole}!`);
      setInviteEmail("");
      setInviteRole("member");
      await fetchMembers();
      onMembersUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add member";
      setError(msg);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    targetUserId: string,
    newRole: "admin" | "member"
  ) => {
    if (!canManage) return;
    if (targetUserId === user?.id && !isOwner) {
      setError("You cannot change your own role.");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("project_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      setSuccess("Role updated successfully.");
      onMembersUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change role";
      setError(msg);
    }
  };

  const handleRemoveMember = async (
    memberId: string,
    targetRole: string,
    memberName: string
  ) => {
    if (!canManage) return;
    if (targetRole === "owner") {
      setError("The project owner cannot be removed.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove "${memberName}" from this project workspace?`
      )
    ) {
      return;
    }

    try {
      const { error: delError } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (delError) {
        throw new Error(delError.message);
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setSuccess(`Removed ${memberName} from project.`);
      onMembersUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove member";
      setError(msg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-members-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-7 shadow-xl border border-slate-200 transition-all z-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="manage-members-title"
                className="text-lg font-bold text-slate-900"
              >
                Project Contributors
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[260px] sm:max-w-none">
                Manage team access for <span className="font-semibold text-slate-700">{projectName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2 animate-in fade-in"
          >
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="font-medium flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-1"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="font-medium flex-1">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="text-emerald-500 hover:text-emerald-700 font-bold ml-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Invite New Member Form (Owners & Admins only) */}
        {canManage ? (
          <form
            onSubmit={handleInvite}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <UserPlus className="h-4 w-4 text-blue-600" />
              <span>Invite New Collaborator</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="bg-white text-xs h-9"
                />
              </div>

              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "member" | "admin")
                }
                className="rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 font-medium focus:border-blue-600 focus:outline-none h-9"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isInviting}
                disabled={!inviteEmail.trim() || isInviting}
                className="h-9 px-4 text-xs font-semibold shrink-0"
              >
                <span>Add</span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            You are viewing the team as a member. Only project owners and admins can invite new collaborators.
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Current Team ({members.length})</span>
            <span>Role / Access</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
            {isLoading ? (
              <div className="space-y-2 py-3">
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-500">
                No contributors registered for this project yet.
              </p>
            ) : (
              members.map((member) => {
                const p = member.profiles;
                const name = p?.full_name || p?.email?.split("@")[0] || "User";
                const email = p?.email || "No email available";
                const isMe = member.user_id === user?.id;
                const initials =
                  name
                    .split(" ")
                    .map((n: string) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "U";

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 pt-2.5 first:pt-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-2xs select-none">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {name}
                          {isMe && (
                            <span className="ml-1 text-[10px] text-blue-600 font-normal">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {member.role === "owner" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                          <ShieldCheck className="h-3 w-3" />
                          Owner
                        </span>
                      ) : canManage && isOwner ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.id,
                              member.user_id,
                              e.target.value as "admin" | "member"
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 font-medium focus:border-blue-600 focus:outline-none"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          {member.role === "admin" ? (
                            <Shield className="h-3 w-3 text-blue-600" />
                          ) : (
                            <User className="h-3 w-3 text-slate-400" />
                          )}
                          {member.role === "admin" ? "Admin" : "Member"}
                        </span>
                      )}

                      {/* Remove Button (for owners/admins, cannot remove owner or self) */}
                      {canManage && member.role !== "owner" && !isMe && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(member.id, member.role, name)
                          }
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Remove collaborator"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs px-4"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

