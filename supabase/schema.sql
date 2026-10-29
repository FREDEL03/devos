-- ==============================================================================
-- DevOS Database Schema & Security Policies (Idempotent / Safe to re-run)
-- Target: Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Helper function for automated updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ==============================================================================
-- TABLE: profiles
-- ==============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text default 'Developer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop trigger if exists tr_profiles_updated_at on public.profiles;
create trigger tr_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger to automatically populate profile when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- TABLE: projects
-- ==============================================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  technologies text[] default '{}',
  technology_stack text[] default '{}',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'In Progress',
  start_date text,
  target_date text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backward-compatible alterations if table already existed
alter table public.projects add column if not exists start_date text;
alter table public.projects add column if not exists target_date text;
alter table public.projects add column if not exists technology_stack text[] default '{}';

alter table public.projects enable row level security;

drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_status on public.projects(user_id, status);

drop trigger if exists tr_projects_updated_at on public.projects;
create trigger tr_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- TABLE: tasks
-- ==============================================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed')),
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  completed boolean not null default false,
  due_date text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backward-compatible alterations if table already existed
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists status text not null default 'todo';

alter table public.tasks enable row level security;

drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_user_completed on public.tasks(user_id, completed);

drop trigger if exists tr_tasks_updated_at on public.tasks;
create trigger tr_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- TABLE: code_snippets
-- ==============================================================================
create table if not exists public.code_snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  language text not null default 'typescript',
  code text not null,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backward-compatible alteration if table already existed
alter table public.code_snippets add column if not exists description text;

alter table public.code_snippets enable row level security;

drop policy if exists "Users can view own code snippets" on public.code_snippets;
create policy "Users can view own code snippets"
  on public.code_snippets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own code snippets" on public.code_snippets;
create policy "Users can insert own code snippets"
  on public.code_snippets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own code snippets" on public.code_snippets;
create policy "Users can update own code snippets"
  on public.code_snippets for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own code snippets" on public.code_snippets;
create policy "Users can delete own code snippets"
  on public.code_snippets for delete
  using (auth.uid() = user_id);

create index if not exists idx_code_snippets_user_id on public.code_snippets(user_id);
create index if not exists idx_code_snippets_language on public.code_snippets(user_id, language);

drop trigger if exists tr_code_snippets_updated_at on public.code_snippets;
create trigger tr_code_snippets_updated_at
  before update on public.code_snippets
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- TABLE: work_logs
-- ==============================================================================
create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  entry_date date not null default current_date,
  title text not null,
  work_summary text not null default '',
  challenges text,
  lessons_learned text,
  category text not null default 'General',
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backward-compatible column additions for existing deployments
alter table public.work_logs add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.work_logs add column if not exists entry_date date not null default current_date;
alter table public.work_logs add column if not exists work_summary text not null default '';
alter table public.work_logs add column if not exists challenges text;
alter table public.work_logs add column if not exists lessons_learned text;

alter table public.work_logs enable row level security;

drop policy if exists "Users can view own work logs" on public.work_logs;
create policy "Users can view own work logs"
  on public.work_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own work logs" on public.work_logs;
create policy "Users can insert own work logs"
  on public.work_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own work logs" on public.work_logs;
create policy "Users can update own work logs"
  on public.work_logs for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own work logs" on public.work_logs;
create policy "Users can delete own work logs"
  on public.work_logs for delete
  using (auth.uid() = user_id);

create index if not exists idx_work_logs_user_id on public.work_logs(user_id);
create index if not exists idx_work_logs_entry_date on public.work_logs(user_id, entry_date desc);
create index if not exists idx_work_logs_project_id on public.work_logs(project_id);
create index if not exists idx_work_logs_logged_at on public.work_logs(user_id, logged_at desc);

drop trigger if exists tr_work_logs_updated_at on public.work_logs;
create trigger tr_work_logs_updated_at
  before update on public.work_logs
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- TABLE: learning_entries
-- ==============================================================================
create table if not exists public.learning_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  topic text not null default '',
  description text,
  category text not null default 'General',
  status text not null default 'In Progress' check (status in ('To Learn', 'In Progress', 'Completed', 'Reviewing')),
  target_date text,
  level text not null default 'Intermediate' check (level in ('Beginner', 'Intermediate', 'Advanced', 'Exploratory')),
  mastery_percentage integer not null default 0 check (mastery_percentage >= 0 and mastery_percentage <= 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backward-compatible alterations for existing deployments
alter table public.learning_entries add column if not exists title text;
alter table public.learning_entries add column if not exists description text;
alter table public.learning_entries add column if not exists category text not null default 'General';
alter table public.learning_entries add column if not exists status text not null default 'In Progress';
alter table public.learning_entries add column if not exists target_date text;

alter table public.learning_entries enable row level security;

drop policy if exists "Users can view own learning entries" on public.learning_entries;
create policy "Users can view own learning entries"
  on public.learning_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning entries" on public.learning_entries;
create policy "Users can insert own learning entries"
  on public.learning_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own learning entries" on public.learning_entries;
create policy "Users can update own learning entries"
  on public.learning_entries for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own learning entries" on public.learning_entries;
create policy "Users can delete own learning entries"
  on public.learning_entries for delete
  using (auth.uid() = user_id);

create index if not exists idx_learning_entries_user_id on public.learning_entries(user_id);

drop trigger if exists tr_learning_entries_updated_at on public.learning_entries;
create trigger tr_learning_entries_updated_at
  before update on public.learning_entries
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- TABLE: git_templates
-- ==============================================================================
create table if not exists public.git_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  change_type text not null default 'feat',
  branch_prefix text not null default 'feat/',
  commit_template text not null default '{type}({scope}): {title}',
  pr_title_template text not null default '[{id}] {type}: {title}',
  pr_description_template text not null default '## Summary\n{description}\n\n## Changes\n- {title}\n\n## Verification\n- Tested locally',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.git_templates enable row level security;

drop policy if exists "Users can view own git templates" on public.git_templates;
create policy "Users can view own git templates"
  on public.git_templates for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own git templates" on public.git_templates;
create policy "Users can insert own git templates"
  on public.git_templates for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own git templates" on public.git_templates;
create policy "Users can update own git templates"
  on public.git_templates for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own git templates" on public.git_templates;
create policy "Users can delete own git templates"
  on public.git_templates for delete
  using (auth.uid() = user_id);

create index if not exists idx_git_templates_user_id on public.git_templates(user_id);

drop trigger if exists tr_git_templates_updated_at on public.git_templates;
create trigger tr_git_templates_updated_at
  before update on public.git_templates
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- TABLE: user_settings
-- ==============================================================================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  accent_color text not null default 'violet' check (accent_color in ('violet', 'indigo', 'emerald', 'blue', 'amber', 'rose')),
  date_format text not null default 'YYYY-MM-DD' check (date_format in ('YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY')),
  time_format text not null default '12h' check (time_format in ('12h', '24h')),
  preferred_language text not null default 'TypeScript',
  default_task_priority text not null default 'Medium' check (default_task_priority in ('Low', 'Medium', 'High')),
  default_task_view text not null default 'List' check (default_task_view in ('List', 'Grid')),
  default_task_sort text not null default 'priority' check (default_task_sort in ('priority', 'due_date', 'created_at', 'title')),
  default_landing text not null default 'Dashboard',
  response_style text not null default 'balanced' check (response_style in ('concise', 'balanced', 'detailed')),
  sidebar_collapsed boolean not null default false,
  compact_density boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create index if not exists idx_user_settings_user_id on public.user_settings(user_id);

drop trigger if exists tr_user_settings_updated_at on public.user_settings;
create trigger tr_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- TABLE: activity_logs
-- Append-only audit trail. Users can SELECT but not UPDATE or DELETE.
-- Writes happen server-side via service or anon key (RLS insert allowed).
-- ==============================================================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null default '',
  entity_id text,
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

-- Users can only view their own logs
drop policy if exists "Users can view own activity logs" on public.activity_logs;
create policy "Users can view own activity logs"
  on public.activity_logs for select
  using (auth.uid() = user_id);

-- Users can insert their own logs (server actions write on their behalf)
drop policy if exists "Users can insert own activity logs" on public.activity_logs;
create policy "Users can insert own activity logs"
  on public.activity_logs for insert
  with check (auth.uid() = user_id);

-- No UPDATE or DELETE policies — audit logs are append-only

create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs(user_id, created_at desc);
create index if not exists idx_activity_logs_entity_type on public.activity_logs(user_id, entity_type);
create index if not exists idx_activity_logs_action on public.activity_logs(user_id, action);

