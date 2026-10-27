export interface ProjectMember {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "In Progress" | "Completed" | "Planning";
  priority: "High" | "Medium" | "Low";
  totalTasks: number;
  completedTasks: number;
  dueDate: string;
  members: ProjectMember[];
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  totalTasks: number;
  teamMembersCount: number;
}

export const MOCK_MEMBERS: Record<string, ProjectMember> = {
  alex: {
    id: "mem-1",
    name: "Alex Johnson",
    initials: "AJ",
    avatarBg: "bg-blue-600 text-white",
    role: "Product Lead",
  },
  sarah: {
    id: "mem-2",
    name: "Sarah Chen",
    initials: "SC",
    avatarBg: "bg-purple-600 text-white",
    role: "Lead Designer",
  },
  michael: {
    id: "mem-3",
    name: "Michael Scott",
    initials: "MS",
    avatarBg: "bg-emerald-600 text-white",
    role: "Full-Stack Dev",
  },
  emily: {
    id: "mem-4",
    name: "Emily Davis",
    initials: "ED",
    avatarBg: "bg-amber-600 text-white",
    role: "Marketing Strategist",
  },
  david: {
    id: "mem-5",
    name: "David Kim",
    initials: "DK",
    avatarBg: "bg-rose-600 text-white",
    role: "Backend Engineer",
  },
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Mobile App Redesign",
    description:
      "Modernize the iOS and Android user experience with an intuitive task board, dark mode, and faster navigation flow.",
    category: "Design & UX",
    status: "In Progress",
    priority: "High",
    totalTasks: 18,
    completedTasks: 12,
    dueDate: "Nov 15, 2026",
    members: [MOCK_MEMBERS.sarah, MOCK_MEMBERS.michael, MOCK_MEMBERS.alex],
  },
  {
    id: "proj-2",
    name: "Marketing Launch Q4",
    description:
      "Coordinate multi-channel campaigns, social media assets, press releases, and landing page conversion optimizations.",
    category: "Marketing",
    status: "In Progress",
    priority: "Medium",
    totalTasks: 10,
    completedTasks: 8,
    dueDate: "Nov 30, 2026",
    members: [MOCK_MEMBERS.emily, MOCK_MEMBERS.david],
  },
  {
    id: "proj-3",
    name: "Supabase Cloud Migration",
    description:
      "Migrate legacy database structures to PostgreSQL on Supabase, configure Row Level Security policies, and tune queries.",
    category: "Infrastructure",
    status: "Completed",
    priority: "High",
    totalTasks: 14,
    completedTasks: 14,
    dueDate: "Oct 20, 2026",
    members: [MOCK_MEMBERS.david, MOCK_MEMBERS.alex, MOCK_MEMBERS.michael],
  },
];

export const INITIAL_STATS: DashboardStats = {
  totalProjects: 3,
  activeProjects: 2,
  completedTasks: 34,
  totalTasks: 42,
  teamMembersCount: 5,
};

