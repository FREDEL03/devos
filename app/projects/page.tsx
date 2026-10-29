import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjects } from "./actions";
import { ProjectsPageClient } from "@/components/ProjectsPageClient";
import { Project } from "@/components/types";

export const instant = false;

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dbProjects: Project[] = [];
  try {
    dbProjects = await getProjects();
  } catch (err) {
    console.error("Failed to load projects on server:", err);
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
  };

  return (
    <ProjectsPageClient
      user={authenticatedUser}
      initialProjects={dbProjects}
    />
  );
}
