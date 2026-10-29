"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SnippetManager } from "./SnippetManager";
import { CodeSnippet } from "./types";
import { signout } from "@/app/auth/actions";

interface SnippetsPageClientProps {
  user: {
    id: string;
    email?: string;
    fullName?: string;
  };
  initialSnippets: CodeSnippet[];
}

export function SnippetsPageClient({
  user,
  initialSnippets,
}: SnippetsPageClientProps) {
  const router = useRouter();
  const [snippets, setSnippets] = useState<CodeSnippet[]>(initialSnippets);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    } else {
      router.push(`/?tab=${encodeURIComponent(tab)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col md:flex-row">
      <Sidebar
        activeTab="Code Snippets"
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingTasksCount={0}
        user={user}
        onSignOut={() => signout()}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header
          activeTab="Code Snippets"
          searchQuery=""
          onSearchChange={() => {}}
          onOpenNewTask={() => {
            const btn = document.querySelector<HTMLButtonElement>("[data-new-snippet-btn]");
            if (btn) {
              btn.click();
            } else {
              router.push("/tasks");
            }
          }}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <SnippetManager
            initialSnippets={snippets}
            onSnippetsChange={(updated) => setSnippets(updated)}
          />
        </main>
      </div>
    </div>
  );
}
