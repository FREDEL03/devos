import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLearningEntries } from "./actions";
import { LearningPageClient } from "@/components/LearningPageClient";
import { LearningEntry } from "@/components/types";

export const instant = false;

export default async function LearningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dbEntries: LearningEntry[] = [];
  try {
    dbEntries = await getLearningEntries();
  } catch (err) {
    console.error("Failed to load learning entries on server:", err);
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
  };

  return (
    <LearningPageClient
      user={authenticatedUser}
      initialEntries={dbEntries}
    />
  );
}
