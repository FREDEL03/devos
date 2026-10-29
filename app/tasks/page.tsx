import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTasks } from "./actions";
import { getProjects } from "@/app/projects/actions";
import { TasksPageClient } from "@/components/TasksPageClient";
import { Task, Project } from "@/components/types";

export const instant = false;

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dbTasks: Task[] = [];
  let dbProjects: Project[] = [];
  try {
    const [tasksRes, projectsRes] = await Promise.all([
      getTasks().catch(() => []),
      getProjects().catch(() => []),
    ]);
    dbTasks = tasksRes;
    dbProjects = projectsRes;
  } catch (err) {
    console.error("Failed to load tasks/projects on server:", err);
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
  };

  return (
    <TasksPageClient
      user={authenticatedUser}
      initialTasks={dbTasks}
      initialProjects={dbProjects}
    />
  );
}
