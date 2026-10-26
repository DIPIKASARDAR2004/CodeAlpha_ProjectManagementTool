"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [mockSuccess, setMockSuccess] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

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
    setMockSuccess(null);

    if (!validate()) return;

    setIsLoading(true);

    // Simulate backend auth latency
    setTimeout(() => {
      setIsLoading(false);
      setMockSuccess(`Welcome back! Authenticated as ${email} (Mock Mode).`);
    }, 1200);
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

      {/* Mock Success Banner */}
      {mockSuccess && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 flex items-start gap-3 animate-in fade-in"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-900">Sign in successful!</p>
            <p className="text-emerald-700 text-xs leading-relaxed">{mockSuccess}</p>
            <p className="text-slate-500 text-[11px] mt-1">
              * Frontend mock active. Supabase Auth will be wired in the next step.
            </p>
          </div>
        </div>
      )}

      {/* Forgot Password Notice Modal / Banner */}
      {forgotPasswordNotice && (
        <div
          role="region"
          aria-label="Forgot password notice"
          className="mb-6 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-800 flex items-start gap-3"
        >
          <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-900">Reset Password (UI Mock)</p>
            <p className="mt-0.5 text-blue-700">
              Password recovery will send email reset links once Supabase Auth is enabled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForgotPasswordNotice(false)}
            className="text-blue-500 hover:text-blue-700 text-xs font-semibold underline ml-1"
          >
            Dismiss
          </button>
        </div>
      )}

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
            onClick={() => setForgotPasswordNotice(true)}
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

