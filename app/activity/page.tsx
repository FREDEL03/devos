import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActivityLogs } from "./actions";
import { ActivityLogPageClient } from "@/components/ActivityLogPageClient";

export const dynamic = "force-dynamic";

export default async function ActivityLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: logs, hasMore } = await getActivityLogs({ page: 1 });

  const authenticatedUser = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name,
  };

  return (
    <ActivityLogPageClient
      user={authenticatedUser}
      initialLogs={logs}
      initialHasMore={hasMore}
    />
  );
}
