import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGitTemplates } from "./actions";
import { GitToolkitPageClient } from "@/components/GitToolkitPageClient";

export default async function GitToolkitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dbTemplates = [];
  try {
    dbTemplates = await getGitTemplates();
  } catch (err) {
    console.error("Failed to load git templates on server:", err);
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
  };

  return (
    <GitToolkitPageClient
      user={authenticatedUser}
      initialTemplates={dbTemplates}
    />
  );
}
