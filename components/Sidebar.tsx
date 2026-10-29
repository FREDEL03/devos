"use client";

import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FolderGit2,
  Code2,
  GitBranch,
  Bot,
  Activity,
  GraduationCap,
  Settings,
  X,
  Flame,
  LogOut,
} from "./icons";
import { NavTab } from "./types";
import { confirmDialog } from "./ConfirmDialog";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingTasksCount: number;
  projectsCount?: number;
  user?: { email?: string; fullName?: string } | null;
  onSignOut?: () => void;
}

interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  pendingTasksCount,
  projectsCount,
  user,
  onSignOut,
}: SidebarProps) {
  const displayName = user?.fullName || user?.email?.split("@")[0] || "Developer";
  const displayEmail = user?.email || "active session";
  const initials = displayName.slice(0, 2).toUpperCase();
  const navItems: NavItemConfig[] = [
    { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "Tasks", label: "Tasks", icon: CheckSquare, badge: pendingTasksCount },
    {
      id: "Projects",
      label: "Projects",
      icon: FolderGit2,
      badge: typeof projectsCount === "number" && projectsCount > 0 ? projectsCount : undefined,
    },
    { id: "Code Snippets", label: "Code Snippets", icon: Code2 },
    { id: "Git Toolkit", label: "Git Toolkit", icon: GitBranch },
    { id: "AI Assistant", label: "AI Assistant", icon: Bot },
    { id: "Activity Log", label: "Activity Log", icon: Activity },
    { id: "Learning Tracker", label: "Learning Tracker", icon: GraduationCap },
    { id: "Settings", label: "Settings", icon: Settings },
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const handleSignOutClick = async () => {
    if (!onSignOut) return;
    await confirmDialog({
      title: "Sign out of DevOS?",
      description: "Are you sure you want to log out of your workspace?",
      confirmText: "Sign Out",
      cancelText: "Stay Logged In",
      variant: "normal",
      onConfirm: async () => {
        await onSignOut();
      },
    });
  };

  const content = (
    <div className="flex h-full flex-col justify-between bg-[#0e0e13] border-r border-white/5 text-zinc-300">
      <div>
        {/* Brand header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Flame className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-white text-base">DevOS</span>
                <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-400 border border-violet-500/20">
                  v0.1
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Developer Workspace</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="px-3 py-4">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-violet-600/15 text-violet-300 border border-violet-500/30 shadow-sm shadow-violet-950/40"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-violet-400" : "text-zinc-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${
                        isActive
                          ? "bg-violet-500/30 text-violet-200"
                          : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer info / developer card */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-inner shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-200 truncate">{displayName}</p>
            <p className="text-[11px] text-zinc-500 truncate">{displayEmail}</p>
          </div>
          {onSignOut ? (
            <button
              onClick={handleSignOutClick}
              title="Sign out"
              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
