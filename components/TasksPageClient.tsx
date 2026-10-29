"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TaskManager } from "./TaskManager";
import { Task, Project } from "./types";
import { signout } from "@/app/auth/actions";

interface TasksPageClientProps {
  user: {
    id: string;
    email?: string;
    fullName?: string;
  };
  initialTasks: Task[];
  initialProjects?: Project[];
}

export function TasksPageClient({
  user,
  initialTasks,
  initialProjects = [],
}: TasksPageClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const pendingCount = tasks.filter((t) => !t.completed).length;

  const handleSelectTab = (tab: string) => {
    if (tab === "Dashboard") {
      router.push("/");
    } else if (tab === "Tasks") {
      router.push("/tasks");
    } else if (tab === "Projects") {
      router.push("/projects");
    } else if (tab === "Code Snippets") {
      router.push("/snippets");
    } else if (tab === "Git Toolkit") {
      router.push("/git-toolkit");
    } else if (tab === "AI Assistant") {
      router.push("/ai");
    } else if (tab === "Work Logs") {
      router.push("/work-logs");
    } else if (tab === "Learning Tracker") {
      router.push("/learning");
    } else if (tab === "Settings") {
      router.push("/settings");
    } else {
      router.push(`/?tab=${encodeURIComponent(tab)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col md:flex-row">
      <Sidebar
        activeTab="Tasks"
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingTasksCount={pendingCount}
        user={user}
        onSignOut={() => signout()}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header
          activeTab="Tasks"
          searchQuery=""
          onSearchChange={() => {}}
          onOpenNewTask={() => {
            // TaskManager has its own trigger button
            const btn = document.querySelector<HTMLButtonElement>("[data-new-task-btn]");
            btn?.click();
          }}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <TaskManager
            initialTasks={tasks}
            projects={initialProjects}
            onTasksChange={(updated) => setTasks(updated)}
          />
        </main>
      </div>
    </div>
  );
}
