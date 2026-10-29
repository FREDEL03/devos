export type Priority = "High" | "Medium" | "Low";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type ProjectStatus = "Planning" | "In Progress" | "Review" | "Completed" | "Archived";

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  project?: string;
  project_id?: string | null;
  status?: TaskStatus;
  priority: Priority;
  completed: boolean;
  dueDate?: string;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  description: string | null;
  technologies?: string[];
  technology_stack?: string[];
  technology?: string[]; // backwards compatibility with initial mock
  progress: number;
  status: ProjectStatus;
  start_date?: string | null;
  target_date?: string | null;
  created_at?: string;
  updated_at?: string;
  tasks_count?: number;
  completed_tasks_count?: number;
}

export interface CodeSnippet {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  language: string;
  code: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkLog {
  id: string;
  user_id?: string;
  project_id?: string | null;
  entry_date: string;
  title: string;
  work_summary: string;
  challenges?: string | null;
  lessons_learned?: string | null;
  category?: string;
  duration_minutes?: number | null;
  logged_at?: string;
  created_at?: string;
  updated_at?: string;
  project?: {
    id: string;
    name: string;
  } | null;
}

export type LearningCategory =
  | "Laravel"
  | "Next.js"
  | "React"
  | "TypeScript"
  | "SQL"
  | "AI Integration"
  | "Software Engineering"
  | "DevOps"
  | "Other";

export type LearningStatus = "To Learn" | "In Progress" | "Completed" | "Reviewing";

export interface LearningEntry {
  id: string;
  user_id?: string;
  title: string;
  topic?: string;
  description?: string | null;
  category: LearningCategory | string;
  status: LearningStatus | string;
  target_date?: string | null;
  level?: "Beginner" | "Intermediate" | "Advanced" | "Exploratory";
  mastery_percentage?: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}



export type GitChangeType =
  | "feat"
  | "fix"
  | "refactor"
  | "perf"
  | "chore"
  | "docs"
  | "test"
  | "ci"
  | "style";

export interface GitTemplate {
  id: string;
  user_id?: string;
  name: string;
  change_type: GitChangeType | string;
  branch_prefix?: string;
  commit_template?: string;
  pr_title_template?: string;
  pr_description_template?: string;
  created_at?: string;
  updated_at?: string;
}

export type NavTab =
  | "Dashboard"
  | "Tasks"
  | "Projects"
  | "Code Snippets"
  | "Git Toolkit"
  | "AI Assistant"
  | "Work Logs"
  | "Learning Tracker"
  | "Settings";
