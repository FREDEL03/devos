import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSnippets } from "./actions";
import { SnippetsPageClient } from "@/components/SnippetsPageClient";
import { CodeSnippet } from "@/components/types";

export const instant = false;

export default async function SnippetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dbSnippets: CodeSnippet[] = [];
  try {
    dbSnippets = await getSnippets();
  } catch (err) {
    console.error("Failed to load snippets on server:", err);
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
  };

  return (
    <SnippetsPageClient
      user={authenticatedUser}
      initialSnippets={dbSnippets}
    />
  );
}
