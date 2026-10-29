import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGemini, AIAssistantRequest } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user server-side via Supabase SSR
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in to use the AI Assistant." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body: AIAssistantRequest = await req.json().catch(() => null);
    if (!body || !body.prompt) {
      return NextResponse.json(
        { error: "Invalid request payload. 'prompt' is required." },
        { status: 400 }
      );
    }

    const taskType = body.taskType || "general_query";

    // 3. Call server-side Gemini service
    const result = await callGemini({
      taskType,
      prompt: body.prompt,
      contextCode: body.contextCode,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const rawMessage =
      err instanceof Error ? err.message : "Failed to process AI assistant request.";
    // Ensure credentials never leak into response or logs
    const sanitized = rawMessage.replace(
      /AIza[0-9A-Za-z-_]{35}|AQ\.[0-9A-Za-z-_]+/g,
      "[REDACTED_API_KEY]"
    );
    console.error("AI Assistant API Error:", sanitized);
    return NextResponse.json({ error: sanitized }, { status: 500 });
  }
}
