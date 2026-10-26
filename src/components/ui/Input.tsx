import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      hint,
      icon,
      rightElement,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || undefined;
    const errorId = inputId ? `${inputId}-error` : undefined;
    const hintId = inputId ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && inputId && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            className={cn(
              "block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors",
              "placeholder:text-slate-400",
              "focus:outline-none focus:ring-2",
              icon ? "pl-10" : "pl-3",
              rightElement ? "pr-10" : "pr-3",
              error
                ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-600/20",
              disabled && "cursor-not-allowed bg-slate-50 text-slate-500",
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>

        {error && errorId && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        {hint && !error && hintId && (
          <p id={hintId} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

