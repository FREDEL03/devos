"use client";

import React, { useState, useTransition } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { TodayTasks } from "@/components/TodayTasks";
import { RecentProjects } from "@/components/RecentProjects";
import { QuickActions } from "@/components/QuickActions";
import { TaskModal } from "@/components/TaskModal";
import { TaskManager } from "@/components/TaskManager";
import { ProjectManager } from "@/components/ProjectManager";
import { SnippetManager } from "@/components/SnippetManager";
import { GitToolkit } from "@/components/GitToolkit";
import { AIAssistant } from "@/components/AIAssistant";
import { WorkLogManager } from "@/components/WorkLogManager";
import { LearningManager } from "@/components/LearningManager";
import { SettingsManager } from "@/components/SettingsManager";
import { GitMessageModal } from "@/components/GitMessageModal";
import { SnippetModal } from "@/components/SnippetModal";
import { DedicatedViews } from "@/components/DedicatedViews";
import {
  FolderGit2,
  Clock,
  CheckSquare,
  Code2,
} from "@/components/icons";
import { NavTab, Task, Project, CodeSnippet, WorkLog, LearningEntry, UserSettings, DEFAULT_USER_SETTINGS } from "@/components/types";
import { signout } from "@/app/auth/actions";
import { createTask, updateTask, TaskInput } from "@/app/tasks/actions";
import { createSnippet, SnippetInput } from "@/app/snippets/actions";
import { toast } from "@/components/Toast";

interface DashboardClientProps {
  user: {
    id: string;
    email?: string;
    fullName?: string;
  } | null;
  initialDbTasks?: Task[];
  initialDbProjects?: Project[];
  initialDbSnippets?: CodeSnippet[];
  initialDbWorkLogs?: WorkLog[];
  initialDbLearningEntries?: LearningEntry[];
  initialDbSettings?: UserSettings;
}

export function DashboardClient({
  user,
  initialDbTasks = [],
  initialDbProjects = [],
  initialDbSnippets = [],
  initialDbWorkLogs = [],
  initialDbLearningEntries = [],
  initialDbSettings,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<NavTab>(
    (initialDbSettings?.default_landing as NavTab) || "Dashboard"
  );
  const [tasks, setTasks] = useState<Task[]>(initialDbTasks);
  const [projects, setProjects] = useState<Project[]>(initialDbProjects);
  const [snippets, setSnippets] = useState<CodeSnippet[]>(initialDbSnippets);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(initialDbWorkLogs);
  const [learningEntries, setLearningEntries] = useState<LearningEntry[]>(initialDbLearningEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);

  const [, startTransition] = useTransition();

  // Dynamic statistics counts derived from real tasks & projects
  const activeProjectsCount = projects.filter((p) => p.status !== "Archived").length;
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const savedSnippetsCount = snippets.length;

  // Task actions with Supabase persistence
  const handleToggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    );

    startTransition(async () => {
      const res = await updateTask(id, { completed: nextCompleted });
      if (res?.error) {
        toast.error("Failed to update task", { description: res.error });
        setTasks(tasks);
      } else {
        toast.info(nextCompleted ? "Task marked completed" : "Task reopened");
      }
    });
  };

  const handleCreateTask = async (data: TaskInput) => {
    const res = await createTask(data);
    if (res?.error) {
      toast.error("Failed to create task", { description: res.error });
      return { error: res.error };
    }
    if (res?.data) {
      const created: Task = {
        id: res.data.id,
        user_id: res.data.user_id,
        title: res.data.title,
        description: res.data.description,
        priority: res.data.priority as any,
        status: res.data.status as any,
        completed: res.data.completed,
        due_date: res.data.due_date,
        dueDate: res.data.due_date || undefined,
        created_at: res.data.created_at,
        updated_at: res.data.updated_at,
      };
      setTasks((prev) => [created, ...prev]);
      toast.success("Task created", { description: `"${created.title}" added to your workspace.` });
    }
  };

  const handleSaveSnippet = async (data: SnippetInput) => {
    const res = await createSnippet(data);
    if (res?.error) {
      toast.error("Failed to save snippet", { description: res.error });
      return { error: res.error };
    }
    if (res?.data) {
      const created: CodeSnippet = {
        id: res.data.id,
        user_id: res.data.user_id,
        title: res.data.title,
        description: res.data.description,
        code: res.data.code,
        language: res.data.language,
        tags: res.data.tags || [],
        created_at: res.data.created_at,
        updated_at: res.data.updated_at,
      };
      setSnippets((prev) => [created, ...prev]);
      toast.success("Snippet saved", { description: `"${created.title}" saved to library.` });
    }
  };

  const projectNames = Array.from(new Set(projects.map((p) => p.name)));

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingTasksCount={pendingTasksCount}
        projectsCount={activeProjectsCount}
        user={user}
        onSignOut={() => signout()}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNewTask={() => setIsTaskModalOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === "Dashboard" ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Active Projects"
                  value={activeProjectsCount}
                  subtext={
                    activeProjectsCount === 0
                      ? "No active projects"
                      : `${activeProjectsCount} in active sprint`
                  }
                  icon={FolderGit2}
                  accentColor="violet"
                />
                <StatCard
                  title="Pending Tasks"
                  value={pendingTasksCount}
                  subtext="Synchronized with Supabase"
                  icon={Clock}
                  accentColor="amber"
                />
                <StatCard
                  title="Completed Tasks"
                  value={completedTasksCount}
                  subtext="Live PostgreSQL count"
                  icon={CheckSquare}
                  accentColor="emerald"
                />
                <StatCard
                  title="Saved Snippets"
                  value={savedSnippetsCount}
                  subtext={
                    savedSnippetsCount === 0
                      ? "No saved snippets"
                      : "Synchronized with Supabase"
                  }
                  icon={Code2}
                  accentColor="indigo"
                />
              </div>

              {/* Quick Actions Row */}
              <QuickActions
                onCreateTask={() => setIsTaskModalOpen(true)}
                onSaveSnippet={() => setIsSnippetModalOpen(true)}
                onGenerateGitMessage={() => setActiveTab("Git Toolkit")}
                onOpenAIAssistant={() => setActiveTab("AI Assistant")}
              />

              {/* Main Content Grid: Tasks & Projects */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <TodayTasks
                    tasks={tasks}
                    searchQuery={searchQuery}
                    onToggleTask={handleToggleTask}
                    onOpenNewTask={() => setIsTaskModalOpen(true)}
                  />
                </div>
                <div className="lg:col-span-5">
                  <RecentProjects projects={projects} />
                </div>
              </div>
            </>
          ) : activeTab === "Tasks" ? (
            <TaskManager
              initialTasks={tasks}
              projects={projects}
              onTasksChange={(updated) => setTasks(updated)}
            />
          ) : activeTab === "Projects" ? (
            <ProjectManager
              initialProjects={projects}
              onProjectsChange={(updated) => setProjects(updated)}
            />
          ) : activeTab === "Code Snippets" ? (
            <SnippetManager
              initialSnippets={snippets}
              onSnippetsChange={(updated) => setSnippets(updated)}
            />
          ) : activeTab === "Git Toolkit" ? (
            <GitToolkit />
          ) : activeTab === "AI Assistant" ? (
            <AIAssistant />
          ) : activeTab === "Work Logs" ? (
            <WorkLogManager initialLogs={workLogs} projects={projects} />
          ) : activeTab === "Learning Tracker" ? (
            <LearningManager initialEntries={learningEntries} />
          ) : activeTab === "Settings" ? (
            <SettingsManager
              initialSettings={initialDbSettings || { ...DEFAULT_USER_SETTINGS, user_id: user?.id }}
              user={{
                id: user?.id || "",
                email: user?.email,
                fullName: user?.fullName,
              }}
            />
          ) : (
            <DedicatedViews
              activeTab={activeTab}
              tasks={tasks}
              projects={projects}
              snippets={snippets}
              onOpenNewTask={() => setIsTaskModalOpen(true)}
              onOpenSnippetModal={() => setIsSnippetModalOpen(true)}
              onOpenGitModal={() => setIsGitModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Task Modal for Quick Task Creation */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />

      <GitMessageModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
      />

      <SnippetModal
        isOpen={isSnippetModalOpen}
        onClose={() => setIsSnippetModalOpen(false)}
        onSubmit={handleSaveSnippet}
      />
    </div>
  );
}
