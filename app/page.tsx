import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/app/tasks/actions";
import { getProjects } from "@/app/projects/actions";
import { getSnippets } from "@/app/snippets/actions";
import { getWorkLogs } from "@/app/work-logs/actions";
import { getLearningEntries } from "@/app/learning/actions";
import { getUserSettings, DEFAULT_USER_SETTINGS } from "@/app/settings/actions";
import { DashboardClient } from "@/components/DashboardClient";
import { Task, Project, CodeSnippet, WorkLog, LearningEntry, UserSettings } from "@/components/types";

export const instant = false;

export default async function HomePage() {
  const supabase = await createClient();

  // Server-side authentication check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dbTasks: Task[] = [];
  let dbProjects: Project[] = [];
  let dbSnippets: CodeSnippet[] = [];
  let dbWorkLogs: WorkLog[] = [];
  let dbLearningEntries: LearningEntry[] = [];
  let dbSettings: UserSettings = { ...DEFAULT_USER_SETTINGS, user_id: user.id };

  try {
    const [tasksRes, projectsRes, snippetsRes, workLogsRes, learningRes, settingsRes] = await Promise.all([
      getTasks().catch(() => []),
      getProjects().catch(() => []),
      getSnippets().catch(() => []),
      getWorkLogs().catch(() => []),
      getLearningEntries().catch(() => []),
      getUserSettings().catch(() => ({ ...DEFAULT_USER_SETTINGS, user_id: user.id })),
    ]);
    dbTasks = tasksRes;
    dbProjects = projectsRes;
    dbSnippets = snippetsRes;
    dbWorkLogs = workLogsRes;
    dbLearningEntries = learningRes;
    dbSettings = settingsRes;
  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
  };

  return (
    <DashboardClient
      user={authenticatedUser}
      initialDbTasks={dbTasks}
      initialDbProjects={dbProjects}
      initialDbSnippets={dbSnippets}
      initialDbWorkLogs={dbWorkLogs}
      initialDbLearningEntries={dbLearningEntries}
      initialDbSettings={dbSettings}
    />
  );
}
