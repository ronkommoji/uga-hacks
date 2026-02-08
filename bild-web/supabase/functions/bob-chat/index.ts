import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
    "Access-Control-Max-Age": "86400",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req.headers.get("Origin")) });
  }

  const origin = req.headers.get("Origin");

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const projectId = body?.project_id;
    const message = body?.message;
    if (!projectId || typeof projectId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing project_id in body" }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing message in body" }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, gemini_file_search_store_name")
      .eq("id", projectId)
      .single();
    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const { data: member } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member) {
      return new Response(
        JSON.stringify({ error: "Not a member of this project" }),
        { status: 403, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const storeName = project.gemini_file_search_store_name;
    if (!storeName?.trim()) {
      return new Response(
        JSON.stringify({
          error:
            "No file search store for this project. Open the Bob tab and sync files first.",
        }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const systemInstruction =
      `You are Bob, the AI assistant for the construction project "${project.name}". ` +
      "Answer questions helpfully and concisely. Use the project documents (file search) as context when relevant. " +
      "When you use information from the documents, mention the source when appropriate.";

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction,
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName],
            },
          },
        ],
      },
    });

    const text = response?.text ?? "";
    const candidate = response?.candidates?.[0];
    const rawCitations =
      candidate?.citationMetadata?.citations ?? candidate?.groundingMetadata ?? null;
    // Normalize to { title, startIndex?, endIndex? }[] for client preview + highlight
    const citations = Array.isArray(rawCitations)
      ? rawCitations.map((c: { title?: string; displayName?: string; uri?: string; startIndex?: number; endIndex?: number }) => ({
          title: c?.title ?? c?.displayName ?? (typeof c?.uri === "string" ? c.uri.split("/").pop() ?? c.uri : undefined) ?? "Document",
          startIndex: typeof c?.startIndex === "number" ? c.startIndex : undefined,
          endIndex: typeof c?.endIndex === "number" ? c.endIndex : undefined,
        }))
      : rawCitations && typeof rawCitations === "object" && !Array.isArray(rawCitations)
        ? [{ title: (rawCitations as { title?: string }).title ?? "Document" }]
        : undefined;

    return new Response(
      JSON.stringify({ text, citations }),
      { status: 200, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("bob-chat error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Chat failed",
      }),
      { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
