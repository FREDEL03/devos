"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Settings,
  User,
  Palette,
  Sliders,
  Shield,
  Bot,
  Database,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Laptop,
} from "@/components/icons";
import {
  UserSettings,
  UserDataStats,
  ThemeMode,
  AccentColor,
  DateFormatOption,
  TimeFormatOption,
  TaskViewOption,
  TaskSortOption,
  AIResponseStyle,
  Priority,
  DEFAULT_USER_SETTINGS,
} from "@/components/types";
import {
  updateUserSettings,
  updateUserProfile,
  changePassword,
  exportUserData,
  clearUserCollection,
  getUserDataStats,
  getAISettingsStatus,
} from "@/app/settings/actions";
import { signout } from "@/app/auth/actions";

type SettingsSection =
  | "general"
  | "profile"
  | "appearance"
  | "preferences"
  | "security"
  | "ai"
  | "data";

interface SettingsManagerProps {
  initialSettings: UserSettings;
  user: {
    id: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string;
    createdAt?: string;
    lastSignInAt?: string;
  };
  initialStats?: UserDataStats;
}

export function SettingsManager({
  initialSettings,
  user,
  initialStats,
}: SettingsManagerProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [stats, setStats] = useState<UserDataStats>(
    initialStats || {
      tasksCount: 0,
      projectsCount: 0,
      snippetsCount: 0,
      workLogsCount: 0,
      learningEntriesCount: 0,
    }
  );

  // Profile Form state
  const [fullName, setFullName] = useState(user.fullName || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");

  // Password Form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status and feedback
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // AI Status from server
  const [aiStatus, setAiStatus] = useState<{
    provider: string;
    model: string;
    configured: boolean;
    error?: string;
  }>({
    provider: "Google Gemini",
    model: "gemini-2.5-flash",
    configured: true,
  });

  // Data management modal
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [collectionToClear, setCollectionToClear] = useState<
    "tasks" | "projects" | "code_snippets" | "work_logs" | "learning_entries" | null
  >(null);
  const [confirmText, setConfirmText] = useState("");

  // Load live stats & AI status on mount
  useEffect(() => {
    let mounted = true;
    getUserDataStats().then((data) => {
      if (mounted) setStats(data);
    });
    getAISettingsStatus().then((res) => {
      if (mounted) setAiStatus(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Synchronize client DOM attributes (theme & accent & density)
  useEffect(() => {
    const root = document.documentElement;

    // Apply theme
    if (settings.theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else if (settings.theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      // System
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    }

    // Apply accent color
    root.setAttribute("data-accent", settings.accent_color);

    // Apply density
    if (settings.compact_density) {
      root.classList.add("compact");
    } else {
      root.classList.remove("compact");
    }

    // Cache locally
    try {
      localStorage.setItem("devos_settings", JSON.stringify(settings));
    } catch {
      // LocalStorage error ignore
    }
  }, [settings.theme, settings.accent_color, settings.compact_density]);

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Section 2 & 5 & 7: Save user settings
  const handleSaveSettings = (partial: Partial<UserSettings>, successLabel = "Settings saved successfully.") => {
    const updated = { ...settings, ...partial };
    setSettings(updated);

    startTransition(async () => {
      const res = await updateUserSettings(updated);
      if (res.error) {
        showNotification("error", res.error);
      } else {
        showNotification("success", successLabel);
      }
    });
  };

  // Reset to defaults
  const handleResetSection = (keys: (keyof UserSettings)[]) => {
    const resetValues: Partial<UserSettings> = {};
    for (const key of keys) {
      (resetValues as any)[key] = (DEFAULT_USER_SETTINGS as any)[key];
    }
    handleSaveSettings(resetValues, "Settings reset to defaults.");
  };

  // Section 3: Profile Update
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showNotification("error", "Display name cannot be empty.");
      return;
    }

    startTransition(async () => {
      const res = await updateUserProfile(fullName, avatarUrl);
      if (res.error) {
        showNotification("error", res.error);
      } else {
        showNotification("success", "Profile updated successfully.");
      }
    });
  };

  // Section 6: Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showNotification("error", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("error", "Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await changePassword(newPassword, confirmPassword);
      if (res.error) {
        showNotification("error", res.error);
      } else {
        showNotification("success", "Password updated successfully.");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  // Section 8: Export Data JSON
  const handleExportData = async () => {
    try {
      showNotification("success", "Preparing export file...");
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devos-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("success", "Workspace data exported successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed";
      showNotification("error", msg);
    }
  };

  // Section 8: Clear User Collection
  const handleConfirmClear = async () => {
    if (!collectionToClear) return;
    if (confirmText.toLowerCase() !== "delete") {
      showNotification("error", 'Please type "DELETE" to confirm.');
      return;
    }

    startTransition(async () => {
      const res = await clearUserCollection(collectionToClear);
      if (res.error) {
        showNotification("error", res.error);
      } else {
        showNotification(
          "success",
          `All ${collectionToClear.replace("_", " ")} removed successfully.`
        );
        // Refresh live stats
        getUserDataStats().then(setStats);
      }
      setClearModalOpen(false);
      setCollectionToClear(null);
      setConfirmText("");
    });
  };

  const navSections: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "general", label: "General", icon: Settings },
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "preferences", label: "Preferences", icon: Sliders },
    { id: "security", label: "Security", icon: Shield },
    { id: "ai", label: "AI Configuration", icon: Bot },
    { id: "data", label: "Data Management", icon: Database },
  ];

  const accentColors: { id: AccentColor; name: string; bg: string; ring: string }[] = [
    { id: "violet", name: "Violet", bg: "bg-violet-600", ring: "ring-violet-500" },
    { id: "indigo", name: "Indigo", bg: "bg-indigo-600", ring: "ring-indigo-500" },
    { id: "emerald", name: "Emerald", bg: "bg-emerald-600", ring: "ring-emerald-500" },
    { id: "blue", name: "Blue", bg: "bg-blue-600", ring: "ring-blue-500" },
    { id: "amber", name: "Amber", bg: "bg-amber-600", ring: "ring-amber-500" },
    { id: "rose", name: "Rose", bg: "bg-rose-600", ring: "ring-rose-500" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Workspace Settings</h1>
            <span className="rounded bg-violet-500/10 px-2 py-0.5 text-[11px] font-mono text-violet-400 border border-violet-500/20">
              DevOS Preferences
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your personal profile, appearance tokens, Gemini AI response styles, and database records.
          </p>
        </div>

        {/* Global Feedback Badge */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Main Settings Container: Sidebar + Content */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-56 shrink-0 bg-[#121217] rounded-xl border border-white/5 p-2 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Settings Menu
          </div>
          {navSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm shadow-violet-950/40"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : "text-zinc-400"}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Panels */}
        <main className="flex-1 w-full space-y-6">
          {/* SECTION 1: GENERAL */}
          {activeSection === "general" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">General Application</h3>
                  <p className="text-xs text-zinc-400">Application identity, default landing tabs, and task presentation.</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* App Name Display */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Application Name</label>
                    <input
                      type="text"
                      disabled
                      value="DevOS - Developer Productivity Workspace"
                      className="w-full rounded-lg bg-zinc-900/60 border border-white/10 px-3.5 py-2 text-zinc-400 cursor-not-allowed font-mono text-xs"
                    />
                  </div>

                  {/* Default Landing Tab */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Default Dashboard Landing Tab</label>
                    <select
                      value={settings.default_landing}
                      onChange={(e) => setSettings({ ...settings, default_landing: e.target.value })}
                      className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="Dashboard">Dashboard</option>
                      <option value="Tasks">Tasks</option>
                      <option value="Projects">Projects</option>
                      <option value="Code Snippets">Code Snippets</option>
                      <option value="Git Toolkit">Git Toolkit</option>
                      <option value="AI Assistant">AI Assistant</option>
                      <option value="Work Logs">Work Logs</option>
                      <option value="Learning Tracker">Learning Tracker</option>
                    </select>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Route shown first when opening DevOS.
                    </p>
                  </div>

                  {/* Default Task View: List vs Grid */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Default Task View</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["List", "Grid"] as TaskViewOption[]).map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setSettings({ ...settings, default_task_view: view })}
                          className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                            settings.default_task_view === view
                              ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                              : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {view} View
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Default Task Sorting */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Default Task Sorting</label>
                    <select
                      value={settings.default_task_sort}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          default_task_sort: e.target.value as TaskSortOption,
                        })
                      }
                      className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="priority">Sort by Priority (High to Low)</option>
                      <option value="due_date">Sort by Due Date</option>
                      <option value="created_at">Sort by Date Created (Newest First)</option>
                      <option value="title">Sort by Title (Alphabetical)</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() =>
                      handleResetSection([
                        "default_landing",
                        "default_task_view",
                        "default_task_sort",
                      ])
                    }
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Defaults
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      handleSaveSettings({
                        default_landing: settings.default_landing,
                        default_task_view: settings.default_task_view,
                        default_task_sort: settings.default_task_sort,
                      })
                    }
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save General Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PROFILE */}
          {activeSection === "profile" && (
            <div className="space-y-6">
              <form
                onSubmit={handleUpdateProfile}
                className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-5"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white">Developer Profile</h3>
                  <p className="text-xs text-zinc-400">Authenticated user identity, avatar icon, and public metadata.</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Avatar Preview */}
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow-inner shrink-0 overflow-hidden">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                          onError={() => setAvatarUrl("")}
                        />
                      ) : (
                        (fullName || user.email || "DV").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{fullName || "Developer"}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">{user.email}</p>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Display Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Mark Remegio"
                      className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Avatar URL */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Avatar Image URL (Optional)</label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://github.com/identicons/username.png"
                      className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 font-mono text-xs"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Provide a HTTPS image URL for custom profile avatar.</p>
                  </div>

                  {/* Email Read-only notice */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Primary Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={user.email || ""}
                      className="w-full rounded-lg bg-zinc-900/60 border border-white/10 px-3.5 py-2 text-zinc-400 cursor-not-allowed font-mono text-xs"
                    />
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-zinc-500">
                      <Shield className="w-3.5 h-3.5 text-violet-400" />
                      <span>Email changes are bound to Supabase Auth verification tokens for account integrity.</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isPending ? "Updating..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 3: APPEARANCE */}
          {activeSection === "appearance" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Appearance & Theme</h3>
                  <p className="text-xs text-zinc-400">Theme mode, accent tokens, and sidebar behavior.</p>
                </div>

                <div className="space-y-5 text-xs">
                  {/* Theme Mode: Dark, Light, System */}
                  <div>
                    <label className="block text-zinc-400 mb-2 font-medium">Color Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "dark", label: "Dark", icon: Moon, desc: "Default DevOS zinc darkness" },
                        { id: "light", label: "Light", icon: Sun, desc: "High contrast daylight mode" },
                        { id: "system", label: "System", icon: Laptop, desc: "Syncs with OS preferences" },
                      ].map((t) => {
                        const Icon = t.icon;
                        const isSelected = settings.theme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSaveSettings({ theme: t.id as ThemeMode }, `Theme updated to ${t.label}`)}
                            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                              isSelected
                                ? "bg-violet-600/20 border-violet-500/50 text-white shadow-md shadow-violet-950/40"
                                : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10"
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-violet-400" : "text-zinc-400"}`} />
                            <span className="font-semibold">{t.label}</span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">{t.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accent Color Selection */}
                  <div>
                    <label className="block text-zinc-400 mb-2 font-medium">Accent Color</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {accentColors.map((color) => {
                        const isSelected = settings.accent_color === color.id;
                        return (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => handleSaveSettings({ accent_color: color.id }, `Accent color changed to ${color.name}`)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                              isSelected
                                ? "bg-white/[0.06] border-white/20 text-white"
                                : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full ${color.bg} shadow-sm shrink-0`} />
                            <span className="font-medium text-xs flex-1">{color.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sidebar Behavior */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Sidebar Default Collapsed</p>
                      <p className="text-[11px] text-zinc-500">Minimize sidebar footprint on large displays.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveSettings(
                          { sidebar_collapsed: !settings.sidebar_collapsed },
                          `Sidebar collapse preference toggled.`
                        )
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.sidebar_collapsed ? "bg-violet-600" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.sidebar_collapsed ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: PREFERENCES */}
          {activeSection === "preferences" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Module Preferences</h3>
                  <p className="text-xs text-zinc-400">Date formats, preferred programming languages, and task priorities.</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Date Format */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Date Format</label>
                    <select
                      value={settings.date_format}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          date_format: e.target.value as DateFormatOption,
                        })
                      }
                      className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500 font-mono"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 - e.g. 2026-10-29)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US - e.g. 10/29/2026)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (EU - e.g. 29/10/2026)</option>
                    </select>
                  </div>

                  {/* Time Format */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Time Format</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["12h", "24h"] as TimeFormatOption[]).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setSettings({ ...settings, time_format: fmt })}
                          className={`flex items-center justify-center py-2 rounded-lg border text-xs font-mono font-medium transition-all ${
                            settings.time_format === fmt
                              ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                              : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {fmt === "12h" ? "12-Hour (02:30 PM)" : "24-Hour (14:30)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Programming Language */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Primary Programming Language</label>
                    <select
                      value={settings.preferred_language}
                      onChange={(e) => setSettings({ ...settings, preferred_language: e.target.value })}
                      className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500 font-mono"
                    >
                      {[
                        "TypeScript",
                        "JavaScript",
                        "Python",
                        "PHP / Laravel",
                        "Go",
                        "Rust",
                        "SQL / Postgres",
                        "Java",
                        "C# / .NET",
                        "C++",
                      ].map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-zinc-500 mt-1">Pre-selects language filters in snippets and code generators.</p>
                  </div>

                  {/* Default Task Priority */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Default Task Priority</label>
                    <select
                      value={settings.default_task_priority}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          default_task_priority: e.target.value as Priority,
                        })
                      }
                      className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-zinc-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  {/* Interface Density */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-200">Compact Density</p>
                      <p className="text-[11px] text-zinc-500">Condensed line heights and tighter padding for code inspection.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          compact_density: !settings.compact_density,
                        })
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.compact_density ? "bg-violet-600" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.compact_density ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() =>
                      handleResetSection([
                        "date_format",
                        "time_format",
                        "preferred_language",
                        "default_task_priority",
                        "compact_density",
                      ])
                    }
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Preferences
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      handleSaveSettings({
                        date_format: settings.date_format,
                        time_format: settings.time_format,
                        preferred_language: settings.preferred_language,
                        default_task_priority: settings.default_task_priority,
                        compact_density: settings.compact_density,
                      })
                    }
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: SECURITY */}
          {activeSection === "security" && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <form
                onSubmit={handleChangePassword}
                className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-5"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white">Password & Authentication</h3>
                  <p className="text-xs text-zinc-400">Update your credentials through Supabase Auth official flow.</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Current Authenticated User Email */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Authenticated Account</label>
                    <input
                      type="text"
                      disabled
                      value={user.email || ""}
                      className="w-full rounded-lg bg-zinc-900/60 border border-white/10 px-3.5 py-2 text-zinc-400 cursor-not-allowed font-mono text-xs"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-zinc-400 font-medium">New Password</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPassword ? "Hide" : "Show"}</span>
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 font-mono text-xs"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">Confirm New Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {isPending ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>

              {/* Session Information & Sign Out */}
              <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-semibold text-white">Active Session Details</h3>
                  <p className="text-xs text-zinc-400">Current authentication session metadata.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-zinc-500 text-[11px]">User ID</span>
                    <p className="font-mono text-zinc-200 truncate mt-0.5">{user.id}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-zinc-500 text-[11px]">Auth Provider</span>
                    <p className="font-mono text-zinc-200 mt-0.5">Supabase Auth (SSR Cookies)</p>
                  </div>
                  {user.createdAt && (
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-zinc-500 text-[11px]">Account Created</span>
                      <p className="font-mono text-zinc-200 mt-0.5">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  {user.lastSignInAt && (
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-zinc-500 text-[11px]">Last Sign In</span>
                      <p className="font-mono text-zinc-200 mt-0.5">{new Date(user.lastSignInAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                  <p className="text-[11px] text-zinc-500">Sign out will revoke session cookies across this browser.</p>
                  <button
                    type="button"
                    onClick={() => signout()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: AI CONFIGURATION */}
          {activeSection === "ai" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Google Gemini Integration</h3>
                    <p className="text-xs text-zinc-400">Manage LLM parameters, model selection, and response verbosity.</p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                      aiStatus.configured
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        aiStatus.configured ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <span>{aiStatus.configured ? "Key Configured (Server-Side)" : "Key Missing"}</span>
                  </div>
                </div>

                {/* Configuration details */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-zinc-500 text-[11px]">Provider</span>
                      <p className="font-semibold text-white mt-0.5">{aiStatus.provider}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-zinc-500 text-[11px]">Active Model</span>
                      <p className="font-mono text-violet-400 mt-0.5">{aiStatus.model}</p>
                    </div>
                  </div>

                  {/* Security Callout */}
                  <div className="p-3.5 rounded-lg bg-violet-950/20 border border-violet-500/20 text-zinc-300 space-y-1.5">
                    <div className="flex items-center gap-2 text-violet-300 font-semibold text-xs">
                      <Shield className="w-4 h-4 text-violet-400" />
                      <span>Security & Key Protection</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      API keys are strictly loaded from server-side environment variables (`GEMINI_API_KEY`) and transmitted using the official `x-goog-api-key` HTTP header. Keys are never exposed to browser memory or client bundles.
                    </p>
                  </div>

                  {/* Default AI Response Style */}
                  <div>
                    <label className="block text-zinc-400 mb-2 font-medium">Default Response Style</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: "concise",
                          label: "Concise",
                          desc: "Ultra-terse, minimal prose, pure code snippets & exact fixes.",
                        },
                        {
                          id: "balanced",
                          label: "Balanced",
                          desc: "Clear explanations with structured code and common pitfalls.",
                        },
                        {
                          id: "detailed",
                          label: "Detailed",
                          desc: "In-depth architecture breakdown, step-by-step logic & alternatives.",
                        },
                      ].map((style) => {
                        const isSelected = settings.response_style === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                response_style: style.id as AIResponseStyle,
                              })
                            }
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "bg-violet-600/20 border-violet-500/50 text-white shadow-sm shadow-violet-950/40"
                                : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-xs">{style.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-relaxed">{style.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      handleSaveSettings(
                        { response_style: settings.response_style },
                        "AI response style preference saved."
                      )
                    }
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save AI Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: DATA MANAGEMENT */}
          {activeSection === "data" && (
            <div className="space-y-6">
              {/* Record Summary Stats */}
              <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Database Usage & Records</h3>
                  <p className="text-xs text-zinc-400">Total stored entities owned by your authenticated Supabase user.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: "Tasks", count: stats.tasksCount },
                    { label: "Projects", count: stats.projectsCount },
                    { label: "Snippets", count: stats.snippetsCount },
                    { label: "Work Logs", count: stats.workLogsCount },
                    { label: "Learning", count: stats.learningEntriesCount },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-center"
                    >
                      <span className="text-[11px] text-zinc-500">{item.label}</span>
                      <p className="text-lg font-bold font-mono text-white mt-0.5">{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Export Card */}
              <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Export Personal Data</h3>
                  <p className="text-xs text-zinc-400">
                    Download an offline JSON backup containing all your tasks, projects, code snippets, daily work logs, and preferences.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Includes RLS-protected records belonging to your account only.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export JSON Backup
                  </button>
                </div>
              </div>

              {/* Destructive Actions & Clear Collections */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-rose-300">Clean Database Collections</h3>
                  <p className="text-xs text-zinc-400">
                    Remove specific data collections while keeping your account and authentication active.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCollectionToClear("tasks");
                      setClearModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border border-rose-500/20 bg-zinc-900 text-xs text-zinc-300 hover:text-white hover:border-rose-500/40 transition-colors"
                  >
                    <span>Clear All Tasks</span>
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCollectionToClear("code_snippets");
                      setClearModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border border-rose-500/20 bg-zinc-900 text-xs text-zinc-300 hover:text-white hover:border-rose-500/40 transition-colors"
                  >
                    <span>Clear All Snippets</span>
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCollectionToClear("work_logs");
                      setClearModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border border-rose-500/20 bg-zinc-900 text-xs text-zinc-300 hover:text-white hover:border-rose-500/40 transition-colors"
                  >
                    <span>Clear Work Logs</span>
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-900 border border-white/5 space-y-1 text-xs">
                  <p className="font-semibold text-zinc-300">Account Deletion Policy</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Account deletion requires elevated administrative privileges (`service_role`) via Supabase Auth Admin API or project dashboard. Client-side deletion with service-role keys is strictly prohibited to prevent credential compromise.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal for Destructive Data Clear */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-rose-500/30 bg-[#121217] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Confirm Data Removal</h3>
                <p className="text-xs text-zinc-400">
                  Target collection: <span className="font-mono text-rose-400">{collectionToClear}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This will permanently delete all records in this collection belonging to your account. This action cannot be undone.
            </p>

            <div>
              <label className="block text-zinc-400 text-xs mb-1.5">
                Type <span className="font-mono font-bold text-rose-400">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-lg bg-zinc-900 border border-rose-500/30 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setClearModalOpen(false);
                  setConfirmText("");
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmText.toLowerCase() !== "delete" || isPending}
                onClick={handleConfirmClear}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Clearing..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
