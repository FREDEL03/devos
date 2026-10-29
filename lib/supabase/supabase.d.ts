declare module "@supabase/ssr" {
  import { SupabaseClient } from "@supabase/supabase-js";

  export interface CookieMethodsServer {
    getAll(): { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
    setAll(
      cookiesToSet: {
        name: string;
        value: string;
        options?: Record<string, unknown>;
      }[]
    ): void | Promise<void>;
  }

  export function createBrowserClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string
  ): SupabaseClient<Database>;

  export function createServerClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string,
    options: {
      cookies: CookieMethodsServer;
    }
  ): SupabaseClient<Database>;
}

declare module "@supabase/supabase-js" {
  export interface User {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
      [key: string]: unknown;
    };
    created_at?: string;
  }

  export interface Session {
    access_token: string;
    refresh_token: string;
    user: User;
  }

  export interface AuthError {
    message: string;
    status?: number;
  }

  export interface AuthResponse {
    data: { user: User | null; session: Session | null };
    error: AuthError | null;
  }

  export interface UserResponse {
    data: { user: User | null };
    error: AuthError | null;
  }

  export interface SupabaseClient<Database = unknown> {
    from<T extends keyof Database extends "public" ? keyof Database["public"]["Tables"] : string>(
      relation: T
    ): any;
    auth: {
      getUser(jwt?: string): Promise<UserResponse>;
      getSession(): Promise<{ data: { session: Session | null }; error: AuthError | null }>;
      signInWithPassword(credentials: {
        email: string;
        password: string;
      }): Promise<AuthResponse>;
      signUp(credentials: {
        email: string;
        password: string;
        options?: {
          data?: Record<string, unknown>;
          emailRedirectTo?: string;
        };
      }): Promise<AuthResponse>;
      signOut(): Promise<{ error: AuthError | null }>;
      exchangeCodeForSession(code: string): Promise<{ data: { session: Session | null }; error: AuthError | null }>;
      onAuthStateChange(
        callback: (event: string, session: Session | null) => void
      ): { data: { subscription: { unsubscribe: () => void } } };
    };
  }
}
