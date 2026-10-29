import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings, getUserDataStats } from "./actions";
import { SettingsPageClient } from "@/components/SettingsPageClient";
import { UserSettings, UserDataStats, DEFAULT_USER_SETTINGS } from "@/components/types";

export const instant = false;

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let settings: UserSettings = { ...DEFAULT_USER_SETTINGS, user_id: user.id };
  let stats: UserDataStats = {
    tasksCount: 0,
    projectsCount: 0,
    snippetsCount: 0,
    workLogsCount: 0,
    learningEntriesCount: 0,
  };

  try {
    const [fetchedSettings, fetchedStats] = await Promise.all([
      getUserSettings().catch(() => ({ ...DEFAULT_USER_SETTINGS, user_id: user.id })),
      getUserDataStats().catch(() => stats),
    ]);
    settings = fetchedSettings;
    stats = fetchedStats;
  } catch (err) {
    console.error("Failed to load settings data on server:", err);
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
    avatarUrl: user.user_metadata?.avatar_url,
    createdAt: user.created_at,
    lastSignInAt: (user as any).last_sign_in_at,
  };

  return (
    <SettingsPageClient
      user={authenticatedUser}
      initialSettings={settings}
      initialStats={stats}
    />
  );
}
