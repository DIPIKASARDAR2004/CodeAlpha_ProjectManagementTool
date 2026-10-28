"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Validation & alerts
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check if routed from auth callback failure
  const callbackError = searchParams.get("error");

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setServerError(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in. Please try again.";
      setServerError(message);
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setResetSuccessMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter your email address first" }));
      return;
    }

    setIsResettingPassword(true);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/dashboard`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setServerError(error.message);
      } else {
        setResetSuccessMessage(
          `Password reset instructions have been sent to ${email.trim()}.`
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to send reset instructions.";
      setServerError(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="bg-white px-6 py-8 shadow-sm border border-slate-200/80 rounded-2xl sm:px-9 transition-all">
      {/* Title & Subtitle */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Sign in to your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter your details below to access your projects
        </p>
      </div>

      {/* Callback error warning */}
      {callbackError === "auth_callback_failed" && !serverError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">Authentication link expired</p>
            <p className="mt-0.5 text-amber-700 leading-relaxed">
              The sign-in or verification link was invalid or has expired. Please sign in with your email and password.
            </p>
          </div>
        </div>
      )}

      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Sign in failed</p>
            <p className="mt-0.5 text-red-700 leading-relaxed">{serverError}</p>
          </div>
        </div>
      )}

      {/* Reset Password Success Alert */}
      {resetSuccessMessage && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">Check your email</p>
            <p className="mt-0.5 text-emerald-700 leading-relaxed">
              {resetSuccessMessage}
            </p>
          </div>
        </div>
      )}

      {/* Password Reset Drawer / Notice */}
      {showResetForm ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900 animate-in fade-in">
          <p className="font-semibold mb-1">Reset Password</p>
          <p className="text-blue-700 mb-3">
            Enter your email address above, then click the button below to receive recovery instructions.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePasswordReset}
              isLoading={isResettingPassword}
              className="text-xs h-8"
            >
              Send Reset Link
            </Button>
            <button
              type="button"
              onClick={() => setShowResetForm(false)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Email Field */}
        <Input
          id="login-email"
          name="email"
          type="email"
          label="Email address"
          placeholder="name@company.com"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            if (serverError) setServerError(null);
          }}
          error={errors.email}
          icon={<Mail className="h-4 w-4" />}
        />

        {/* Password Field */}
        <Input
          id="login-password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            if (serverError) setServerError(null);
          }}
          error={errors.password}
          icon={<Lock className="h-4 w-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-blue-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          }
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-sm">
          <label
            htmlFor="remember-me"
            className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-800"
          >
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-medium">Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => setShowResetForm(true)}
            className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
          {!isLoading && <ArrowRight className="h-4 w-4 ml-1" />}
        </Button>
      </form>

      {/* Switch to Sign Up */}
      <div className="mt-7 text-center pt-5 border-t border-slate-100">
        <p className="text-xs sm:text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline ml-0.5"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
