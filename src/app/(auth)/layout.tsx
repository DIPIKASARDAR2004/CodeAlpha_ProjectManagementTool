import React from "react";
import Link from "next/link";
import { CheckSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-700">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-100/60 rounded-full blur-3xl opacity-70" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group transition-transform duration-150 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                <CheckSquare className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-bold tracking-tight text-slate-900 block leading-tight">
                  TaskFlow
                </span>
                <span className="text-xs font-medium text-slate-500 tracking-wide">
                  PROJECT MANAGEMENT
                </span>
              </div>
            </Link>
          </div>

          {/* Children (Card content: Login / Register) */}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <p>
          TaskFlow &bull; Collaborative Project Management
        </p>
      </footer>
    </div>
  );
}

