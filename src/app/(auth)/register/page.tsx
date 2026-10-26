"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [isSuccess, setIsSuccess] = useState(false);

  // Password rules validation for visual helper
  const hasMinLength = formData.password.length >= 8;
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
    formData.password
  );

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    // Simulate backend user creation latency
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div className="bg-white px-6 py-8 shadow-sm border border-slate-200/80 rounded-2xl sm:px-9 transition-all">
      {/* Title & Subtitle */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Get started with TaskFlow and organize your projects
        </p>
      </div>

      {/* Success State */}
      {isSuccess ? (
        <div className="text-center py-4 space-y-4 animate-in fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Account Created Successfully!
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xs mx-auto">
              Your mock account for <span className="font-medium text-slate-900">{formData.email}</span> has been set up.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              (Backend authentication will be integrated in a future step.)
            </p>
          </div>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="primary" size="md" className="w-full">
                Proceed to Sign In
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Sign Up Form */
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name */}
          <Input
            id="register-name"
            name="name"
            type="text"
            label="Full name"
            placeholder="Alex Johnson"
            required
            autoComplete="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={errors.name}
            icon={<User className="h-4 w-4" />}
          />

          {/* Email */}
          <Input
            id="register-email"
            name="email"
            type="email"
            label="Email address"
            placeholder="alex@company.com"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            icon={<Mail className="h-4 w-4" />}
          />

          {/* Password */}
          <div className="space-y-2">
            <Input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="Create a strong password"
              required
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
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

            {/* Password Requirement Indicators */}
            {formData.password && (
              <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-2.5 text-xs space-y-1.5 transition-all">
                <div
                  className={`flex items-center gap-1.5 ${
                    hasMinLength ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  <div
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] ${
                      hasMinLength
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>At least 8 characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasNumberOrSpecial ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  <div
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] ${
                      hasNumberOrSpecial
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Contains a number or symbol</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <Input
            id="register-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm password"
            placeholder="Repeat your password"
            required
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            icon={<Lock className="h-4 w-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-blue-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            }
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-4"
            isLoading={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
            {!isLoading && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>
        </form>
      )}

      {/* Switch to Sign In */}
      <div className="mt-7 text-center pt-5 border-t border-slate-100">
        <p className="text-xs sm:text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline ml-0.5"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

