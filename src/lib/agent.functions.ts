import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildDrafts, fallbackExtract, normalize, rankBanks, type Extracted, type InventoryRow } from "./agent-logic";
import { NO_ADVICE, nemotron } from "./nebius.server";
import { AI_CONFIG } from "./ai-config";

const fieldsSchema = z.object({
  blood_group: z.string().max(4),
  component: z.string().max(40),
  units: z.number().int().min(1).max(20),
  city: z.string().max(40),
  urgency: z.enum(["low", "medium", "high", "critical"]),
});

async function inventoryFor(e: Extracted) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("inventory").select("bank_name,city,km,phone,blood_group,component,units,expiry_date").eq("city", e.city).eq("blood_group", e.blood_group).eq("component", e.component);
  return rankBanks((data ?? []) as InventoryRow[], e);
}

/** agent-request: free text (English/Hinglish) → fields → top 3 banks + drafts. Pass `fields` to re-run with edited values. */
export const agentRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ message: z.string().max(1000).optional(), fields: fieldsSchema.optional() }).parse(d))
  .handler(async ({ data }) => {
    let fields: Extracted;
    let source: "ai" | "fallback" = "fallback";
    if (data.fields) {
      fields = normalize(data.fields);
    } else {
      const text = data.message ?? "";
      const r = await nemotron("agent-request", {
        messages: [
          { role: "system", content: `${NO_ADVICE} Extract the blood request from the user's message (English or Hinglish) by calling extract_request. Blood groups use the format O−, O+, A−, A+, B−, B+, AB−, AB+. Components: Whole blood, Packed red cells, Platelets, Plasma. Cities: Mumbai, Pune, Nagpur, Delhi.` },
          { role: "user", content: text },
        ],
        tools: [{ type: "function", function: { name: "extract_request", description: "Structured blood request", parameters: { type: "object", properties: {
          blood_group: { type: "string" }, component: { type: "string" }, units: { type: "integer" }, city: { type: "string" }, urgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
        }, required: ["blood_group", "component", "units", "city", "urgency"] } } }],
        tool_choice: { type: "function", function: { name: "extract_request" } },
      });
      const args = r?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      try {
        fields = args ? normalize(JSON.parse(args)) : fallbackExtract(text);
        if (args) source = "ai";
      } catch {
        fields = fallbackExtract(text);
      }
    }
    const matches = await inventoryFor(fields);
    return { fields, matches, drafts: buildDrafts(fields, matches), source };
  });

/** Human-approved send. Donors only counted when consent_alerts is true. Demo: logs, does not deliver SMS. */
export const sendAlert = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ fields: fieldsSchema, hospital: z.string().max(600), donor: z.string().max(600), notifyDonors: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let donorCount = 0;
    if (data.notifyDonors) {
      const { count } = await supabaseAdmin.from("donors").select("id", { count: "exact", head: true }).eq("city", data.fields.city).eq("blood_group", data.fields.blood_group).eq("consent_alerts", true);
      donorCount = count ?? 0;
    }
    await supabaseAdmin.from("alerts").insert([
      { kind: "hospital", message: data.hospital, recipients: 3 },
      ...(data.notifyDonors ? [{ kind: "donor", message: data.donor, recipients: donorCount }] : []),
    ]);
    return { donorCount };
  });

const HISTORY: Record<string, number[]> = {
  "Mumbai|O−": [82, 78, 80, 74, 70, 66, 63, 60],
  "Pune|B+ platelets": [55, 52, 50, 49, 47, 44, 43, 41],
  "Delhi|AB−": [40, 41, 39, 38, 37, 37, 36, 35],
  "Nagpur|A−": [60, 58, 57, 57, 56, 55, 55, 54],
};

/** forecast-shortage: linear trend + Nemotron one-sentence explanation and risk level. */
export const forecastShortage = createServerFn({ method: "POST" }).handler(async () => {
  const SAFE = 40;
  const items = Object.entries(HISTORY).map(([k, h]) => {
    const last = h[h.length - 1] ?? 0; const slope = (last - (h[0] ?? 0)) / (h.length - 1);
    const forecast = [1, 2, 3, 4].map((d) => Math.max(0, Math.round(last + slope * d * 1.6)));
    const at72 = forecast[2] ?? 0;
    const fallbackRisk = at72 < SAFE ? "high" : at72 < SAFE + 10 ? "medium" : "low";
    return { key: k, label: k.replace("|", " · "), history: h, forecast, at72, risk: fallbackRisk as "low" | "medium" | "high", explanation: `Stock is expected to reach ${at72}% of normal in 72 hours (safe level ${SAFE}%).` };
  });
  const r = await nemotron("forecast-shortage", {
    messages: [
      { role: "system", content: `${NO_ADVICE} For each blood stock forecast, write one plain sentence (max 25 words) explaining it for a blood bank manager and set risk low, medium or high. Safe level is ${SAFE}% of normal. Call report_forecasts.` },
      { role: "user", content: JSON.stringify(items.map(({ key, history, forecast }) => ({ key, history, forecast }))) },
    ],
    tools: [{ type: "function", function: { name: "report_forecasts", parameters: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { key: { type: "string" }, risk: { type: "string", enum: ["low", "medium", "high"] }, explanation: { type: "string" } }, required: ["key", "risk", "explanation"] } } }, required: ["items"] } } }],
    tool_choice: { type: "function", function: { name: "report_forecasts" } },
  });
  let source: "ai" | "fallback" = "fallback";
  try {
    const args = r?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (args) {
      const out = JSON.parse(args) as { items: { key: string; risk: string; explanation: string }[] };
      for (const o of out.items) {
        const it = items.find((i) => i.key === o.key);
        if (it && ["low", "medium", "high"].includes(o.risk)) { it.risk = o.risk as typeof it.risk; it.explanation = o.explanation.slice(0, 240); }
      }
      source = "ai";
    }
  } catch { /* keep fallback */ }
  return { items, safe: SAFE, source };
});

export const aiStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("ai_runs").select("ms,created_at,ok").order("created_at", { ascending: false }).limit(50);
  const ok = (data ?? []).filter((r) => r.ok);
  return {
    model: process.env["NEBIUS_MODEL"] ?? AI_CONFIG.model,
    provider: AI_CONFIG.provider,
    keyConfigured: Boolean(process.env["NEBIUS_API_KEY"]),
    lastRun: data?.[0]?.created_at ?? null,
    avgMs: ok.length ? Math.round(ok.reduce((s, r) => s + r.ms, 0) / ok.length) : null,
    runs: ok.length,
  };
});
