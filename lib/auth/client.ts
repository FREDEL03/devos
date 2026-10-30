"use client";

import { signout, AuthActionResult } from "@/app/auth/actions";

export async function clientSignout(): Promise<AuthActionResult> {
  const result = await signout();
  if (result.success) {
    window.location.href = "/login";
  } else {
    // Could show error toast
    console.error("Sign out failed:", result.error);
  }
  return result;
}