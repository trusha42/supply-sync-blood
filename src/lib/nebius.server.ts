import { AI_CONFIG } from "./ai-config";

type Msg = { role: "system" | "user" | "assistant"; content: string };

/** Calls Nemotron on Nebius Token Factory (OpenAI-compatible). Server only. Logs timing to ai_runs. */
export async function nemotron(fn: string, body: { messages: Msg[]; tools?: unknown[]; tool_choice?: unknown }) {
  const key = process.env["NEBIUS_API_KEY"];
  if (!key) return null;
  const started = Date.now();
  let ok = false;
  try {
    const res = await fetch(`${process.env["NEBIUS_BASE_URL"] ?? AI_CONFIG.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: process.env["NEBIUS_MODEL"] ?? AI_CONFIG.model, temperature: 0.1, ...body }),
    });
    if (!res.ok) {
      console.error("Nebius error", res.status, await res.text());
      return null;
    }
    ok = true;
    return (await res.json()) as { choices: { message: { content?: string | null; tool_calls?: { function: { arguments: string } }[] } }[] };
  } catch (e) {
    console.error("Nebius call failed", e);
    return null;
  } finally {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_runs").insert({ fn, model: process.env["NEBIUS_MODEL"] ?? AI_CONFIG.model, ms: Date.now() - started, ok });
  }
}

export const NO_ADVICE = "You are BloodBridge, a logistics assistant that helps locate blood units. Never give medical advice, diagnoses, dosing or treatment suggestions. Only handle logistics.";
