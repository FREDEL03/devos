"use client";

import React from "react";
import { Search, Plus, Menu, Sparkles, X } from "./icons";
import { NavTab } from "./types";

interface HeaderProps {
  activeTab: NavTab;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewTask: () => void;
  onOpenMobileSidebar: () => void;
}

export function Header({
  activeTab,
  searchQuery,
  onSearchChange,
  onOpenNewTask,
  onOpenMobileSidebar,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#09090b]/80 px-4 md:px-8 backdrop-blur-md">
      {/* Left section: mobile hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span>{activeTab}</span>
            {activeTab === "Dashboard" && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs font-normal text-violet-400">
                <Sparkles className="w-3 h-3 text-violet-400" />
                Live Hub
              </span>
            )}
          </h1>
          <p className="hidden sm:block text-xs text-zinc-500">
            {activeTab === "Dashboard"
              ? "Central overview of tasks, repositories, and quick tools"
              : `Manage your ${activeTab.toLowerCase()}`}
          </p>
        </div>
      </div>

      {/* Right section: Search bar + New Task button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative w-40 sm:w-64 md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tasks, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg bg-zinc-900/90 border border-white/10 pl-9 pr-8 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* New Task Button */}
        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </header>
  );
}
