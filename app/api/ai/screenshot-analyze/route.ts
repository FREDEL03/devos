import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGemini } from "@/lib/ai/gemini";
import { logActivity } from "@/lib/activity/logger";

export const maxDuration = 30; // Allow longer for image processing

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
        { error: "Unauthorized. You must be signed in to use this feature." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json().catch(() => null);
    if (!body || !body.imageBase64 || !body.imageMimeType) {
      return NextResponse.json(
        { error: "Invalid request payload. 'imageBase64' and 'imageMimeType' are required." },
        { status: 400 }
      );
    }

    const { imageBase64, imageMimeType } = body;

    // Validate MIME type
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedMimeTypes.includes(imageMimeType)) {
      return NextResponse.json(
        { error: `Unsupported image format. Allowed: ${allowedMimeTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate base64 size (approx 5MB max)
    const base64Length = imageBase64.length - (imageBase64.includes(",") ? imageBase64.indexOf(",") + 1 : 0);
    const sizeInBytes = (base64Length * 3) / 4;
    if (sizeInBytes > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // 3. Log activity: screenshot uploaded for analysis
    await logActivity({
      action: "screenshot.uploaded",
      entityType: "task",
      entityId: undefined,
      description: "Uploaded a screenshot for task extraction",
      metadata: { mimeType: imageMimeType, sizeBytes: Math.round(sizeInBytes) },
    });

    // 4. Call Gemini with the image
    const result = await callGemini({
      taskType: "analyze_screenshot",
      prompt: "Extract tasks from this work ticket screenshot. Output JSON array as specified.",
      imageBase64,
      imageMimeType,
      responseStyle: "concise",
    });

    // 5. Parse JSON response
    let extractedTasks: Array<{
      title: string;
      description?: string;
      priority?: "High" | "Medium" | "Low";
      due_date?: string;
    }> = [];

    try {
      // Extract JSON from response (might have surrounding text)
      const jsonMatch = result.content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        extractedTasks = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try parsing whole content
        extractedTasks = JSON.parse(result.content);
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", result.content);
      return NextResponse.json(
        { error: "AI response could not be parsed as valid task list.", rawResponse: result.content },
        { status: 500 }
      );
    }

    // Validate tasks structure
    if (!Array.isArray(extractedTasks)) {
      return NextResponse.json(
        { error: "AI did not return a valid task array." },
        { status: 500 }
      );
    }

    // Clean and validate each task
    const validatedTasks = extractedTasks
      .filter((task) => task.title && typeof task.title === "string")
      .map((task) => ({
        title: task.title.trim(),
        description: task.description ? task.description.trim() : undefined,
        priority: task.priority && ["High", "Medium", "Low"].includes(task.priority) ? task.priority : undefined,
        due_date: task.due_date && /^\d{4}-\d{2}-\d{2}$/.test(task.due_date) ? task.due_date : undefined,
      }))
      .slice(0, 10); // Limit to 10 tasks

    // 6. Log successful analysis
    await logActivity({
      action: "screenshot.analyzed",
      entityType: "task",
      entityId: undefined,
      description: `Analyzed screenshot and extracted ${validatedTasks.length} potential tasks`,
      metadata: { taskCount: validatedTasks.length },
    });

    return NextResponse.json({
      success: true,
      tasks: validatedTasks,
      model: result.model,
    });
  } catch (err: unknown) {
    const rawMessage =
      err instanceof Error ? err.message : "Failed to process screenshot analysis.";
    // Ensure credentials never leak
    const sanitized = rawMessage.replace(
      /AIza[0-9A-Za-z-_]{35}|AQ\.[0-9A-Za-z-_]+/g,
      "[REDACTED_API_KEY]"
    );
    console.error("Screenshot analysis error:", sanitized);

    // Log failure
    const supabase = await createClient().catch(() => null);
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (user) {
        try {
          await logActivity({
            action: "screenshot.analysis_failed",
            entityType: "task",
            entityId: undefined,
            description: "Failed to analyze screenshot",
            metadata: { error: sanitized?.substring(0, 200) || "Unknown error" },
          });
        } catch {}
      }
    }

    return NextResponse.json({ error: sanitized }, { status: 500 });
  }
}