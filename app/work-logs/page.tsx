import { redirect } from "next/navigation";

// Work Logs has been replaced by the Activity Log feature.
// Redirect to maintain backward-compatible URLs.
export default function WorkLogsRedirectPage() {
  redirect("/activity");
}
