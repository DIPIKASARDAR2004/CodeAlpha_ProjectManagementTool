-- ==============================================================================
-- TaskFlow Database Migration: 001_initial_schema.sql
-- Description: Core schema, profiles, projects, members, tasks, comments, triggers,
--              safe non-recursive RLS policies, and role protection.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABLES DEFINITIONS
-- ------------------------------------------------------------------------------

-- 2.1 Profiles Table (Synchronized with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT DEFAULT '',
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 Project Members Table (Roles: 'owner', 'admin', 'member')
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (project_id, user_id)
);

-- 2.4 Tasks Table (Status: 'todo', 'in_progress', 'done'; Priority: 'low', 'medium', 'high')
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5 Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_comments_task ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);

-- ------------------------------------------------------------------------------
-- 4. REUSABLE HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- ------------------------------------------------------------------------------

-- Returns true if user is a member of the project
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = _project_id
      AND user_id = _user_id
  );
$$;

-- Returns true if user is an owner or admin of the project
CREATE OR REPLACE FUNCTION public.is_project_admin_or_owner(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = _project_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
  );
$$;

-- Returns true if user is the direct project creator/owner
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = _project_id
      AND owner_id = _user_id
  );
$$;

-- ------------------------------------------------------------------------------
-- 5. AUTOMATED TRIGGERS & BUSINESS LOGIC GUARDS
-- ------------------------------------------------------------------------------

-- 5.1 Updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_comments_updated_at ON public.comments;
CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.2 Safe Signup Trigger (Creates profile on auth.users insert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), profiles.avatar_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.3 Auto-add Project Creator as 'owner' in project_members
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();

-- 5.4 Cross-Tenant Task Assignee Validation Guard
-- Ensures tasks can only be assigned to verified members of the parent project
CREATE OR REPLACE FUNCTION public.validate_task_assignee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    IF NOT public.is_project_member(NEW.project_id, NEW.assigned_to) THEN
      RAISE EXCEPTION 'Assigned user % is not a member of project %', NEW.assigned_to, NEW.project_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_task_assignee_trigger ON public.tasks;
CREATE TRIGGER validate_task_assignee_trigger
  BEFORE INSERT OR UPDATE OF assigned_to, project_id ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_task_assignee();

-- 5.5 Member Role Protection & Self-Elevation Prevention
CREATE OR REPLACE FUNCTION public.protect_project_member_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Allow internal server/system operations when auth.uid() is null
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Prevent users from modifying their own role
  IF TG_OP = 'UPDATE' AND NEW.user_id = auth.uid() AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Users cannot elevate or change their own project role.';
  END IF;

  -- Determine the executing user's role in the target project
  SELECT role INTO v_caller_role
  FROM public.project_members
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    AND user_id = auth.uid();

  -- Only owners and admins can manage membership
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    -- Special case: allow members to delete their own membership (leaving the project)
    IF TG_OP = 'DELETE' AND OLD.user_id = auth.uid() THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'Only project owners and admins can manage project members.';
  END IF;

  -- Only owners can assign or change an 'owner' role
  IF (TG_OP = 'INSERT' AND NEW.role = 'owner') OR
     (TG_OP = 'UPDATE' AND NEW.role = 'owner' AND OLD.role IS DISTINCT FROM NEW.role) THEN
    IF v_caller_role <> 'owner' THEN
      RAISE EXCEPTION 'Only the project owner can assign the owner role.';
    END IF;
  END IF;

  -- Admins cannot modify or remove owners
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.role = 'owner' AND v_caller_role <> 'owner' THEN
    RAISE EXCEPTION 'Only the project owner can modify or remove another project owner.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS protect_project_members_trigger ON public.project_members;
CREATE TRIGGER protect_project_members_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_project_member_role();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 6.1 Profiles Policies
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6.2 Projects Policies
CREATE POLICY "Users can view projects they belong to"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    public.is_project_member(id, auth.uid())
  );

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and admins can update project details"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    public.is_project_admin_or_owner(id, auth.uid())
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    public.is_project_admin_or_owner(id, auth.uid())
  );

CREATE POLICY "Only project owners can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- 6.3 Project Members Policies
CREATE POLICY "Project members can view project members"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Owners and admins can add project members"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_project_admin_or_owner(project_id, auth.uid()));

CREATE POLICY "Owners and admins can update member records"
  ON public.project_members FOR UPDATE
  TO authenticated
  USING (public.is_project_admin_or_owner(project_id, auth.uid()))
  WITH CHECK (public.is_project_admin_or_owner(project_id, auth.uid()));

CREATE POLICY "Members can leave or admins can remove members"
  ON public.project_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_project_admin_or_owner(project_id, auth.uid())
  );

-- 6.4 Tasks Policies
CREATE POLICY "Members can view project tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can create project tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can update project tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (public.is_project_member(project_id, auth.uid()))
  WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can delete project tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- 6.5 Comments Policies
CREATE POLICY "Members can view task comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = comments.task_id
        AND public.is_project_member(t.project_id, auth.uid())
    )
  );

CREATE POLICY "Members can post task comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = comments.task_id
        AND public.is_project_member(t.project_id, auth.uid())
    )
  );

CREATE POLICY "Authors can update their own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authors or admins can delete comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = comments.task_id
        AND public.is_project_admin_or_owner(t.project_id, auth.uid())
    )
  );

