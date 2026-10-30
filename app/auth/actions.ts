"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/logger";

export interface AuthActionResult {
  error?: string;
  success?: string;
}

export async function login(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");

  // Log login after successful auth (logActivity reads session internally, no credentials stored)
  await logActivity({
    action: "auth.login",
    entityType: "auth",
    description: "Signed in to DevOS",
  });

  redirect("/");
}

export async function signup(formData: FormData): Promise<AuthActionResult> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || "Developer",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If Supabase has email confirmation enabled, session will be null
  if (data?.user && !data.session) {
    return {
      success:
        "Account created! Please check your email inbox to confirm your registration.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signout(): Promise<AuthActionResult> {
  try {
    const supabase = await createClient();
    // Log before sign out while session still active
    await logActivity({
      action: "auth.logout",
      entityType: "auth",
      description: "Signed out of DevOS",
    });
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    revalidatePath("/", "layout");
    return { success: "Signed out successfully" };
  } catch (error) {
    return { error: "Failed to sign out" };
  }
}
