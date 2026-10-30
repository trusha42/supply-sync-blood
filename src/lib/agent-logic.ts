import { BLOOD_GROUPS, COMPONENTS, CITIES } from "./demo-data";

export type Urgency = "low" | "medium" | "high" | "critical";
export type Extracted = { blood_group: string; component: string; units: number; city: string; urgency: Urgency };
export type InventoryRow = { bank_name: string; city: string; km: number; phone: string | null; blood_group: string; component: string; units: number; expiry_date: string };
export type Match = InventoryRow & { reason: string; days_to_expiry: number };

const MS_DAY = 86400000;

/** Rank: most stock first, then nearest expiry, then distance. Only banks with enough... any stock. */
export function rankBanks(rows: InventoryRow[], want: Pick<Extracted, "blood_group" | "component" | "city" | "units">, today = new Date()): Match[] {
  return rows
    .filter((r) => r.city === want.city && r.blood_group === want.blood_group && r.component === want.component && r.units > 0)
    .map((r) => ({ ...r, days_to_expiry: Math.round((new Date(r.expiry_date).getTime() - today.getTime()) / MS_DAY) }))
    .sort((a, b) => b.units - a.units || a.days_to_expiry - b.days_to_expiry || Number(a.km) - Number(b.km))
    .slice(0, 3)
    .map((r) => ({
      ...r,
      reason: `${r.units >= want.units ? "Can cover" : "Partly covers"} ${want.units} unit${want.units === 1 ? "" : "s"} (${r.units} in stock), expires in ${r.days_to_expiry} days, ${r.km} km away.`,
    }));
}

/** Keyword fallback used when the AI key is missing or the call fails. Handles simple English/Hinglish. */
export function fallbackExtract(text: string): Extracted {
  const t = text.toLowerCase().replace(/negative|neg|ve-|−/g, "-").replace(/positive|pos|ve\+/g, "+");
  const g = /\b(ab|a|b|o)\s*([+-])/.exec(t);
  const blood_group = g ? `${(g[1] ?? "o").toUpperCase()}${g[2] === "-" ? "−" : "+"}` : "O−";
  const component = /platelet/.test(t) ? "Platelets" : /plasma/.test(t) ? "Plasma" : /prbc|red cell|packed/.test(t) ? "Packed red cells" : "Whole blood";
  const u = /(\d+)\s*(unit|bottle|bag|u\b)/.exec(t);
  const city = CITIES.find((c) => t.includes(c.toLowerCase())) ?? "Mumbai";
  const urgency: Urgency = /critical|jaldi|abhi|turant|emergency|urgent|asap/.test(t) ? "critical" : /today|aaj/.test(t) ? "high" : "medium";
  return { blood_group: (BLOOD_GROUPS as readonly string[]).includes(blood_group) ? blood_group : "O−", component, units: u ? Math.min(Number(u[1]), 20) : 1, city, urgency };
}

export function normalize(e: Partial<Extracted>): Extracted {
  const fb: Extracted = { blood_group: "O−", component: "Whole blood", units: 1, city: "Mumbai", urgency: "medium" };
  const bg = String(e.blood_group ?? "").replace("-", "−").toUpperCase().replace("NEGATIVE", "−").replace("POSITIVE", "+");
  return {
    blood_group: (BLOOD_GROUPS as readonly string[]).includes(bg) ? bg : fb.blood_group,
    component: COMPONENTS.find((c) => c.toLowerCase() === String(e.component ?? "").toLowerCase()) ?? fb.component,
    units: Math.max(1, Math.min(20, Math.round(Number(e.units) || 1))),
    city: CITIES.find((c) => c.toLowerCase() === String(e.city ?? "").toLowerCase()) ?? fb.city,
    urgency: (["low", "medium", "high", "critical"] as const).find((u) => u === e.urgency) ?? fb.urgency,
  };
}

export function buildDrafts(e: Extracted, matches: Match[]) {
  const top = matches[0];
  const hospital = top
    ? `BloodBridge request (${e.urgency}): ${e.units} unit(s) of ${e.blood_group} ${e.component.toLowerCase()} needed in ${e.city}. Your bank shows ${top.units} in stock. Please confirm availability and hold for verification.`
    : `BloodBridge request (${e.urgency}): ${e.units} unit(s) of ${e.blood_group} ${e.component.toLowerCase()} needed in ${e.city}. No verified stock found nearby. Please check and update.`;
  const donor = `Someone near you in ${e.city} needs ${e.blood_group} blood. If you're able and willing to donate, please reply YES. Saying no is always fine.`;
  return { hospital, donor };
}
