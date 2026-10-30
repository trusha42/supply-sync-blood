import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, CheckCircle2, Loader2, MapPin, Send, Info } from "lucide-react";
import { agentRequest, sendAlert } from "@/lib/agent.functions";
import { BLOOD_GROUPS, CITIES, COMPONENTS } from "@/lib/demo-data";
import { SAFETY_NOTICE } from "@/lib/ai-config";
import type { Extracted, Match } from "@/lib/agent-logic";

type Result = { fields: Extracted; matches: Match[]; drafts: { hospital: string; donor: string }; source: "ai" | "fallback" };

export function SafetyNotice() {
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {SAFETY_NOTICE}
    </p>
  );
}

export function AskBloodBridge() {
  const ask = useServerFn(agentRequest);
  const send = useServerFn(sendAlert);
  const [msg, setMsg] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hospital, setHospital] = useState("");
  const [donor, setDonor] = useState("");
  const [notifyDonors, setNotifyDonors] = useState(true);
  const [sent, setSent] = useState<number | null>(null);

  const apply = (r: Result) => { setRes(r); setHospital(r.drafts.hospital); setDonor(r.drafts.donor); setSent(null); };
  const run = async (data: { message?: string; fields?: Extracted }) => {
    setBusy(true); setErr(null);
    try { apply(await ask({ data })); } catch { setErr("Something went wrong. Please try again."); } finally { setBusy(false); }
  };
  const edit = (k: keyof Extracted, v: string | number) => res && setRes({ ...res, fields: { ...res.fields, [k]: v } as Extracted });

  return (
    <div className="space-y-4">
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (msg.trim()) run({ message: msg.trim() }); }}>
        <label className="sr-only" htmlFor="ask-bb">Describe what you need</label>
        <input id="ask-bb" className="field flex-1" maxLength={1000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Mumbai mein 3 unit O negative PRBC chahiye, urgent" />
        <button className="btn btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />} Ask BloodBridge</button>
      </form>
      {err && <p className="text-sm text-destructive" role="alert">{err}</p>}

      {res && (
        <div className="space-y-4" aria-live="polite">
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-sm font-semibold">What I understood {res.source === "fallback" && <span className="font-normal text-muted-foreground">(basic reading, AI not connected)</span>}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <select aria-label="Blood group" className="field" value={res.fields.blood_group} onChange={(e) => edit("blood_group", e.target.value)}>{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
              <select aria-label="Component" className="field" value={res.fields.component} onChange={(e) => edit("component", e.target.value)}>{COMPONENTS.map((g) => <option key={g}>{g}</option>)}</select>
              <input aria-label="Units" type="number" min={1} max={20} className="field" value={res.fields.units} onChange={(e) => edit("units", Number(e.target.value))} />
              <select aria-label="City" className="field" value={res.fields.city} onChange={(e) => edit("city", e.target.value)}>{CITIES.map((g) => <option key={g}>{g}</option>)}</select>
              <select aria-label="Urgency" className="field capitalize" value={res.fields.urgency} onChange={(e) => edit("urgency", e.target.value)}>{["low", "medium", "high", "critical"].map((g) => <option key={g}>{g}</option>)}</select>
            </div>
            <button className="btn btn-outline mt-3" disabled={busy} onClick={() => run({ fields: res.fields })}>Update matches</button>
          </div>

          <div>
            <p className="text-sm font-semibold">Best matches</p>
            {res.matches.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No verified stock found nearby. Alerts can still go to blood banks and willing donors.</p>
            ) : (
              <ol className="mt-2 space-y-2">
                {res.matches.map((m, i) => (
                  <li key={m.bank_name} className="rounded-2xl bg-muted px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{i + 1}. {m.bank_name}</p>
                      <span className="shrink-0 rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">{m.units} units</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden /> {m.reason}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Draft hospital alert<textarea className="field mt-1 min-h-28" maxLength={600} value={hospital} onChange={(e) => setHospital(e.target.value)} /></label>
            <label className="text-sm font-semibold">Draft donor alert<textarea className="field mt-1 min-h-28" maxLength={600} value={donor} onChange={(e) => setDonor(e.target.value)} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={notifyDonors} onChange={(e) => setNotifyDonors(e.target.checked)} /> Also alert donors who have opted in</label>

          {sent !== null ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success" role="status"><CheckCircle2 className="h-4 w-4" /> Alert sent to blood banks{notifyDonors ? ` and ${sent} opted-in donor${sent === 1 ? "" : "s"}` : ""} (demo, nothing actually delivered).</p>
          ) : (
            <button className="btn btn-primary" disabled={busy} onClick={async () => {
              setBusy(true);
              try { const r = await send({ data: { fields: res.fields, hospital, donor, notifyDonors } }); setSent(r.donorCount); } catch { setErr("Couldn't send. Please try again."); } finally { setBusy(false); }
            }}><Send className="h-4 w-4" /> Send alert</button>
          )}
        </div>
      )}
      <SafetyNotice />
    </div>
  );
}
