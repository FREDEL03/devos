import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkLogs } from "./actions";
import { getProjects } from "@/app/projects/actions";
import { WorkLogsPageClient } from "@/components/WorkLogsPageClient";

export default async function WorkLogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dbLogs = [];
  try {
    dbLogs = await getWorkLogs();
  } catch (err) {
    console.error("Failed to fetch work logs on server:", err);
  }

  let dbProjects = [];
  try {
    dbProjects = await getProjects();
  } catch (err) {
    console.error("Failed to fetch projects on server:", err);
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
  };

  return (
    <WorkLogsPageClient
      user={authenticatedUser}
      initialLogs={dbLogs}
      projects={dbProjects}
    />
  );
}
