import { Task, Project, CodeSnippet } from "./types";

export const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Implement JWT refresh token rotation middleware",
    project: "Auth Gateway",
    priority: "High",
    completed: false,
    dueDate: "Today",
  },
  {
    id: "task-2",
    title: "Refactor Tailwind color palette for dark violet theme",
    project: "DevOS",
    priority: "Medium",
    completed: true,
    dueDate: "Today",
  },
  {
    id: "task-3",
    title: "Benchmark memory usage on streaming SSE responses",
    project: "AI Copilot",
    priority: "High",
    completed: false,
    dueDate: "Today",
  },
  {
    id: "task-4",
    title: "Add keyboard shortcut trap for command palette (Ctrl+K)",
    project: "DevOS",
    priority: "Medium",
    completed: false,
    dueDate: "Tomorrow",
  },
  {
    id: "task-5",
    title: "Write integration tests for PostgreSQL connection pooling",
    project: "Core API",
    priority: "Low",
    completed: true,
    dueDate: "Yesterday",
  },
  {
    id: "task-6",
    title: "Audit Docker compose multi-stage build cache invalidation",
    project: "Infra Ops",
    priority: "Low",
    completed: false,
    dueDate: "This week",
  },
];

export const initialProjects: Project[] = [];

export const initialSnippets: CodeSnippet[] = [];
