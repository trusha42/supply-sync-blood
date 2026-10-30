import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Cpu, Loader2 } from "lucide-react";
import { aiStats, forecastShortage } from "@/lib/agent.functions";
import { SafetyNotice } from "./ask-bloodbridge";

const riskCls = { low: "bg-success-soft text-success", medium: "bg-warning-soft text-warning", high: "bg-coral-soft text-destructive" };
const W = 560, H = 240, P = 32;

function Chart({ history, forecast, safe }: { history: number[]; forecast: number[]; safe: number }) {
  const all = [...history, ...forecast];
  const n = all.length;
  const x = (i: number) => P + (i * (W - P * 2)) / (n - 1);
  const y = (v: number) => H - P - (v / 100) * (H - P * 2);
  const line = (pts: number[], off: number) => pts.map((v, i) => `${i ? "L" : "M"}${x(i + off)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Stock history and forecast">
      {[0, 50, 100].map((t) => <line key={t} x1={P} x2={W - P} y1={y(t)} y2={y(t)} className="stroke-border" />)}
      <line x1={P} x2={W - P} y1={y(safe)} y2={y(safe)} className="stroke-warning" strokeWidth={2} strokeDasharray="2 4" />
      <text x={W - P} y={y(safe) - 6} textAnchor="end" className="fill-warning text-[11px] font-semibold">Safe level</text>
      <path d={line(history, 0)} fill="none" className="stroke-chart-1" strokeWidth={3} strokeLinecap="round" />
      <path d={line([history[history.length - 1] ?? 0, ...forecast], history.length - 1)} fill="none" className="stroke-primary" strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
      <text x={x(0)} y={H - 8} className="fill-muted-foreground text-[10px]">7 days ago</text>
      <text x={x(history.length - 1)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">Today</text>
      <text x={x(n - 1)} y={H - 8} textAnchor="end" className="fill-muted-foreground text-[10px]">+4 days</text>
    </svg>
  );
}

export function AiForecastPanels() {
  const fc = useServerFn(forecastShortage);
  const st = useServerFn(aiStats);
  const f = useQuery({ queryKey: ["forecast"], queryFn: () => fc(), staleTime: 300_000 });
  const s = useQuery({ queryKey: ["ai-stats", f.dataUpdatedAt], queryFn: () => st(), enabled: !f.isFetching });
  const main = f.data?.items[0];

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <section className="card-surface p-5 sm:p-6 lg:col-span-2">
        <h2 className="text-lg font-bold">Predicted shortages in the next 72 hours</h2>
        {f.isLoading || !f.data ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Running forecast…</p>
        ) : (
          <>
            {main && <><p className="mt-1 text-sm text-muted-foreground">{main.label}, % of normal stock. Dashed line is the forecast.</p><Chart history={main.history} forecast={main.forecast} safe={f.data.safe} /></>}
            <ul className="mt-4 space-y-2">
              {f.data.items.map((it) => (
                <li key={it.key} className="flex items-start justify-between gap-3 rounded-2xl bg-muted px-4 py-3">
                  <div><p className="font-semibold">{it.label}</p><p className="text-sm text-muted-foreground">{it.explanation}</p></div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${riskCls[it.risk]}`}>{it.risk}</span>
                </li>
              ))}
            </ul>
            {f.data.source === "fallback" && <p className="mt-3 text-xs text-muted-foreground">AI explanations appear once the Nebius key is added. Showing basic trend text.</p>}
          </>
        )}
        <div className="mt-4"><SafetyNotice /></div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Cpu className="h-5 w-5 text-primary" aria-hidden /> AI transparency</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="text-muted-foreground">Model</dt><dd className="break-all font-semibold">{s.data?.model ?? "…"}</dd></div>
          <div><dt className="text-muted-foreground">Provider</dt><dd className="font-semibold">{s.data?.provider ?? "Nebius Token Factory"}</dd></div>
          <div><dt className="text-muted-foreground">Last run</dt><dd className="font-semibold">{s.data?.lastRun ? new Date(s.data.lastRun).toLocaleString("en-IN") : "Not run yet"}</dd></div>
          <div><dt className="text-muted-foreground">Average response time</dt><dd className="font-semibold">{s.data?.avgMs != null ? `${s.data.avgMs} ms (${s.data.runs} runs)` : "No successful runs yet"}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd className="font-semibold">{s.data ? (s.data.keyConfigured ? "Connected" : "Key not added yet") : "…"}</dd></div>
        </dl>
      </section>
    </div>
  );
}
