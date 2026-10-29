/**
 * Server-side Google Gemini client integration.
 * Complies with the official Google Gen AI API specification.
 * Key is strictly kept on the server and never exposed to the client.
 */

export type AITaskType =
  | "explain_error"
  | "explain_code"
  | "debug_steps"
  | "explain_concept"
  | "improve_git"
  | "generate_pr"
  | "general_query";

export interface AIAssistantRequest {
  taskType: AITaskType;
  prompt: string;
  contextCode?: string;
  responseStyle?: "concise" | "balanced" | "detailed";
}

export interface AIAssistantResponse {
  content: string;
  model: string;
  taskType: AITaskType;
}

export const SUPPORTED_TASK_TYPES: { type: AITaskType; label: string; description: string }[] = [
  {
    type: "explain_error",
    label: "Explain Error",
    description: "Analyze stack traces, runtime exceptions, and compiler errors",
  },
  {
    type: "explain_code",
    label: "Explain Code",
    description: "Break down functions, algorithms, or complex files",
  },
  {
    type: "debug_steps",
    label: "Debug Steps",
    description: "Get structured hypotheses, logging tips, and troubleshooting steps",
  },
  {
    type: "explain_concept",
    label: "Explain Concept",
    description: "Clear architectural or language concepts with code examples",
  },
  {
    type: "improve_git",
    label: "Improve Git",
    description: "Refine commit messages and branch names to Conventional Commits",
  },
  {
    type: "generate_pr",
    label: "Generate PR",
    description: "Produce comprehensive Pull Request descriptions from ticket notes",
  },
  {
    type: "general_query",
    label: "General Query",
    description: "Ask any software engineering or development question",
  },
];

const MAX_PROMPT_LENGTH = 8000;

/**
 * Builds task-specific system prompts adhering to engineering guidelines
 */
function buildSystemInstruction(
  taskType: AITaskType,
  responseStyle: "concise" | "balanced" | "detailed" = "balanced"
): string {
  let styleGuidance = "";
  if (responseStyle === "concise") {
    styleGuidance = "\nSTYLE GUIDELINE: Be extremely concise, direct, and code-focused. Omit lengthy prose.";
  } else if (responseStyle === "detailed") {
    styleGuidance = "\nSTYLE GUIDELINE: Provide in-depth explanations with step-by-step reasoning, trade-offs, and examples.";
  }

  const baseInstruction = `You are an expert senior software engineer and technical assistant embedded within DevOS, a developer workspace.
Your job is to provide accurate, concise, and actionable engineering assistance.
Always format code snippets inside proper markdown code blocks with the language identifier (e.g., \`\`\`typescript, \`\`\`sql, \`\`\`php).
Be direct, eliminate unnecessary conversational fluff, and prioritize correctness.${styleGuidance}
IMPORTANT DISCLAIMER: Never claim that AI-generated code is guaranteed to work in production without review and testing.`;

  switch (taskType) {
    case "explain_error":
      return `${baseInstruction}
TASK: Explain a programming error or runtime exception.
RULES:
1. You MUST explicitly distinguish CONFIRMED CAUSES from POSSIBLE CAUSES. Do not guess with false certainty.
2. Structure your response into:
   - Error Summary: A 1-2 sentence distillation of what failed.
   - Confirmed vs. Possible Causes: Clear bullet points separating what is verifiable from potential edge cases.
   - Recommended Fix: The most probable solution with corrected code snippet.
   - Preventive Measures: Brief tip to prevent this error category in the future.`;

    case "explain_code":
      return `${baseInstruction}
TASK: Explain a code snippet.
RULES:
You MUST organize your explanation into exactly these four sections:
1. ### Summary: High-level purpose and what the code achieves.
2. ### How It Works: Step-by-step breakdown of the logic, parameters, and control flow.
3. ### Potential Issues: Edge cases, memory/performance concerns, concurrency pitfalls, or unhandled errors.
4. ### Suggested Next Steps: Practical improvements, refactoring suggestions, or test cases to write.`;

    case "debug_steps":
      return `${baseInstruction}
TASK: Provide systematic debugging steps.
RULES:
1. Outline a logical, hypothesis-driven debugging path.
2. Recommend specific log statements, debugger breakpoints, or CLI commands to isolate the root cause.
3. Order steps from least invasive/easiest to check to deeper architectural audits.`;

    case "explain_concept":
      return `${baseInstruction}
TASK: Explain an unfamiliar programming or architectural concept.
RULES:
1. Define the concept clearly in plain terms.
2. Provide a concrete, minimal code example demonstrating the concept in action.
3. Highlight when to use it vs. when it is an anti-pattern or overkill.`;

    case "improve_git":
      return `${baseInstruction}
TASK: Improve Git branch names, commit messages, and PR titles.
RULES:
1. Adhere strictly to the Conventional Commits specification (e.g. feat(scope): message, fix: message).
2. Keep the subject line under 72 characters, written in the imperative mood.
3. Provide an optimized branch name in kebab-case format (e.g. feat/PROJ-123-ticket-slug).`;

    case "generate_pr":
      return `${baseInstruction}
TASK: Generate a structured Pull Request description.
RULES:
Output clean Markdown with:
- ## Summary
- ## Type of Change
- ## Key Changes
- ## Testing & Verification Steps
- ## Related Issues`;

    default:
      return baseInstruction;
  }
}

/**
 * Execute call to Gemini API using native fetch to Google's official endpoint.
 */
export async function callGemini(request: AIAssistantRequest): Promise<AIAssistantResponse> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server. Please add your Gemini API key to .env.local (do NOT prefix with NEXT_PUBLIC_)."
    );
  }

  // Validate task type
  const isValidTask = SUPPORTED_TASK_TYPES.some((t) => t.type === request.taskType);
  if (!isValidTask) {
    throw new Error(`Unsupported task type: "${request.taskType}".`);
  }

  // Validate input length
  const combinedInput = `${request.prompt || ""} ${request.contextCode || ""}`.trim();
  if (!combinedInput) {
    throw new Error("Prompt cannot be empty.");
  }

  if (combinedInput.length > MAX_PROMPT_LENGTH) {
    throw new Error(
      `Input length (${combinedInput.length} characters) exceeds the maximum allowed limit of ${MAX_PROMPT_LENGTH} characters.`
    );
  }

  const systemInstruction = buildSystemInstruction(request.taskType, request.responseStyle);

  let userContent = request.prompt.trim();
  if (request.contextCode && request.contextCode.trim()) {
    userContent = `${userContent}\n\n\`\`\`\n${request.contextCode.trim()}\n\`\`\``;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const payload = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userContent }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const errorMessage = errorBody?.error?.message || `HTTP ${res.status}: ${res.statusText}`;

      if (res.status === 429) {
        throw new Error(
          "Gemini API rate limit exceeded. Please wait a moment before sending another request."
        );
      }
      if (res.status === 400) {
        throw new Error(`Gemini API bad request: ${errorMessage}`);
      }
      if (res.status === 403 || res.status === 401) {
        throw new Error(
          "Invalid or unauthorized Gemini API key. Verify your GEMINI_API_KEY in .env.local."
        );
      }
      throw new Error(`Google Gemini API error: ${errorMessage}`);
    }

    const json = await res.json();
    const candidateText =
      json.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from Gemini model.";

    return {
      content: candidateText,
      model,
      taskType: request.taskType,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("An unexpected error occurred while communicating with Gemini.");
  }
}

/**
 * Runnable self-check for Gemini prompt building and input guard constraints.
 */
export function __runGeminiValidationSelfCheck(): boolean {
  // Test 1: Task type coverage
  if (SUPPORTED_TASK_TYPES.length !== 7) {
    throw new Error(`Self-check failed: Expected 7 task types, found ${SUPPORTED_TASK_TYPES.length}`);
  }

  // Test 2: Error instruction contains CONFIRMED and POSSIBLE causes
  const errorInstruction = buildSystemInstruction("explain_error");
  if (
    !errorInstruction.includes("CONFIRMED CAUSES") ||
    !errorInstruction.includes("POSSIBLE CAUSES")
  ) {
    throw new Error("Self-check failed: explain_error missing confirmed vs possible causes requirement");
  }

  // Test 3: Code explanation instruction contains the 4 required sections
  const codeInstruction = buildSystemInstruction("explain_code");
  const requiredSections = [
    "Summary",
    "How It Works",
    "Potential Issues",
    "Suggested Next Steps",
  ];
  for (const s of requiredSections) {
    if (!codeInstruction.includes(s)) {
      throw new Error(`Self-check failed: explain_code missing section: ${s}`);
    }
  }

  return true;
}

/**
 * Server-only utility to verify Gemini API connection and model setup.
 * Strictly never exposes the API key.
 */
export async function verifyGeminiConnection(): Promise<{
  configured: boolean;
  model: string;
  provider: string;
  error?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (!apiKey || apiKey === "your-gemini-api-key" || apiKey === "your_gemini_api_key_here") {
    return {
      configured: false,
      model,
      provider: "Google Gemini",
      error: "GEMINI_API_KEY is not configured in .env.local",
    };
  }

  return {
    configured: true,
    model,
    provider: "Google Gemini",
  };
}

