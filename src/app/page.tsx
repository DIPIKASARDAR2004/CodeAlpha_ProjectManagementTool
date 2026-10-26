import Link from "next/link";
import { CheckSquare, ArrowRight, ShieldCheck, Users, KanbanSquare } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation Bar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <CheckSquare className="h-5 w-5 stroke-[2.2]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              TaskFlow
            </span>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 rounded-lg shadow-sm transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
          Next-Generation Team Collaboration
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-2xl">
          Manage projects and collaborate with{" "}
          <span className="text-blue-600">effortless flow</span>.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
          TaskFlow helps teams organize tasks, track progress across custom boards,
          and collaborate seamlessly in one unified workspace.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 h-11 px-6 rounded-lg font-medium shadow-sm transition-all text-sm"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 h-11 px-6 rounded-lg font-medium shadow-sm transition-all text-sm"
          >
            Sign In to Workspace
          </Link>
        </div>

        {/* Feature Cards Preview */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left w-full">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <KanbanSquare className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Visual Task Boards</h3>
            <p className="text-xs text-slate-500 mt-1">
              Organize tasks across To Do, In Progress, and Done with clear priorities and due dates.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Team Collaboration</h3>
            <p className="text-xs text-slate-500 mt-1">
              Assign tasks to team members and keep communication focused with threaded comments.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Role-Based Security</h3>
            <p className="text-xs text-slate-500 mt-1">
              Secure project workspaces backed by PostgreSQL Row Level Security (RLS).
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200/60 bg-white">
        <p>
          TaskFlow &bull; Collaborative Workspaces for Modern Teams
        </p>
      </footer>
    </main>
  );
}
