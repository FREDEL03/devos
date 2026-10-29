import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AIAssistantPageClient } from "@/components/AIAssistantPageClient";

export default async function AIAssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
  };

  return <AIAssistantPageClient user={authenticatedUser} />;
}
