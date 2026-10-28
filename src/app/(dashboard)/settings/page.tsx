"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Database,
  Calendar,
  LogOut,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const supabase = createClient();

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Real Database Connectivity Status
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  // Sync initial full name from profile/user
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    } else if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    } else if (user?.email) {
      setFullName(user.email.split("@")[0]);
    }
  }, [profile, user]);

  // Real database connectivity check
  useEffect(() => {
    let isMounted = true;
    const checkDatabase = async () => {
      try {
        const { error } = await supabase.from("profiles").select("id").limit(1);
        if (isMounted) {
          setDbStatus(error ? "disconnected" : "connected");
        }
      } catch {
        if (isMounted) {
          setDbStatus("disconnected");
        }
      }
    };

    checkDatabase();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = fullName.trim();
    if (!trimmed) {
      setProfileError("Full name cannot be blank.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: trimmed })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      await refreshProfile();
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setProfileError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match. Please verify both fields.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      setPasswordSuccess("Password updated successfully! Your account is secured.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password";
      setPasswordError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse pb-12">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 h-64" />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 h-64" />
      </div>
    );
  }

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const isEmailVerified = Boolean(user?.email_confirmed_at);
  const accountCreatedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 animate-in fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal profile, security credentials, and workspace preferences.
        </p>
      </div>

      {/* Section 1: Profile Information */}
      <section
        aria-labelledby="profile-heading"
        className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 id="profile-heading" className="text-base sm:text-lg font-bold text-slate-900">
              Personal Profile
            </h2>
            <p className="text-xs text-slate-500">
              Update your display name and view verified account information
            </p>
          </div>
        </div>

        {profileSuccess && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="font-medium">{profileSuccess}</p>
          </div>
        )}

        {profileError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="font-medium">{profileError}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
          {/* Avatar Preview */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-sm ring-4 ring-white select-none">
            {initials}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{user?.email}</span>
            </p>
            <div className="pt-1 flex items-center gap-2">
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  Email Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  <ShieldAlert className="h-3 w-3" />
                  Unverified Email
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="full-name"
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              required
            />

            <div>
              <label
                htmlFor="user-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Account Email
              </label>
              <div className="relative">
                <input
                  id="user-email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed select-none"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Email is managed through Supabase Authentication.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingProfile}
              className="text-xs px-5 h-9"
            >
              Save Profile
            </Button>
          </div>
        </form>
      </section>

      {/* Section 2: Security & Change Password */}
      <section
        aria-labelledby="security-heading"
        className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 id="security-heading" className="text-base sm:text-lg font-bold text-slate-900">
              Account Security
            </h2>
            <p className="text-xs text-slate-500">
              Update your account password to keep your projects secure
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="font-medium">{passwordSuccess}</p>
          </div>
        )}

        {passwordError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="font-medium">{passwordError}</p>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="new-password"
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              hint="Minimum 6 characters"
              required
            />

            <Input
              id="confirm-password"
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              hint="Must match new password exactly"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingPassword}
              disabled={!newPassword || !confirmPassword || isUpdatingPassword}
              className="text-xs px-5 h-9"
            >
              Update Password
            </Button>
          </div>
        </form>
      </section>

      {/* Section 3: Workspace & System Overview */}
      <section
        aria-labelledby="system-heading"
        className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4"
      >
        <h2 id="system-heading" className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Environment & System Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Account Created Date */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 shadow-2xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Account Created</p>
              <p className="text-xs font-semibold text-slate-800">
                {accountCreatedDate || "Unavailable"}
              </p>
            </div>
          </div>

          {/* Real Database Connectivity Check */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 shadow-2xs">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Database Connection</p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    dbStatus === "connected"
                      ? "bg-emerald-500"
                      : dbStatus === "checking"
                      ? "bg-amber-500 animate-ping"
                      : "bg-red-500"
                  }`}
                />
                <p className="text-xs font-semibold text-slate-800">
                  {dbStatus === "connected"
                    ? "Online (Supabase PostgreSQL)"
                    : dbStatus === "checking"
                    ? "Checking connection..."
                    : "Offline / Unreachable"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Session & Sign Out */}
      <section
        aria-labelledby="session-heading"
        className="rounded-2xl border border-red-200/80 bg-red-50/40 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <h2 id="session-heading" className="text-base font-bold text-red-950">
            Session Management
          </h2>
          <p className="text-xs text-red-800">
            Sign out of your active TaskFlow session on this browser.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={signOut}
          className="border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 text-xs shrink-0 self-start sm:self-auto h-9 px-4 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          <span>Sign Out</span>
        </Button>
      </section>
    </div>
  );
}

