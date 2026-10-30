import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Building2,
  Database,
  HandHeart,
  HeartPulse,
  Lock,
  ShieldCheck,
  Siren,
  Sparkles,
  Trash2,
  UserCheck,
  Hospital,
  Smile,
} from "lucide-react";
import { CountUp } from "@/components/count-up";
import { ForecastChart } from "@/components/forecast-chart";
import { DemoBadge } from "@/components/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BloodBridge AI – Right blood, right place, in time" },
      {
        name: "description",
        content:
          "One verified view of blood stock across Indian hospitals and blood banks, with AI that predicts shortages and alerts donors.",
      },
      { property: "og:title", content: "BloodBridge AI – Smart Blood Bank Network" },
      {
        property: "og:description",
        content:
          "Verified blood inventory and AI shortage forecasting for hospitals, blood banks and donors in India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Section({
  id,
  eyebrow,
  title,
  children,
  intro,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:py-20">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {intro && <p className="mt-3 max-w-2xl text-muted-foreground">{intro}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

function Index() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            Blood inventory coordination for hospitals, banks and donors
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            Right blood. Right place. <span className="text-primary">Better coordination.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Search recorded blood inventory, manage organization stock, and register as a donor
            through one connected platform.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="btn btn-primary">
              Login
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link to="/signup" className="btn btn-outline">
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Network stats" className="mx-auto max-w-6xl px-4">
        <div className="card-surface grid grid-cols-2 gap-6 p-6 sm:p-8 lg:grid-cols-4">
          {[
            { v: 128450, l: "Units tracked" },
            { v: 642, l: "Hospitals and banks connected" },
            { v: 1870, l: "Shortages predicted early" },
            { v: 11, l: "Average time to a match", s: " min" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-heading text-3xl font-extrabold sm:text-4xl">
                <CountUp to={s.v} suffix={s.s} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-xs text-muted-foreground">Demo data</p>
      </section>

      {/* Problem */}
      <Section
        eyebrow="The problem"
        title="Blood exists. It's just in the wrong place, at the wrong time."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              i: Database,
              t: "No shared, verified data",
              d: "Stock lives in registers, spreadsheets and phone calls. Families often don't know where to look.",
            },
            {
              i: Siren,
              t: "Slow emergency response",
              d: "In an emergency, hours go into calling blood banks one by one to find a single unit.",
            },
            {
              i: Trash2,
              t: "Waste next to shortage",
              d: "Units expire in one bank while a hospital a few kilometres away runs out.",
            },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="card-surface card-lift p-6">
              <I className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how" eyebrow="How it works" title="Three steps from stock to saved time">
        <ol className="grid gap-5 md:grid-cols-3">
          {[
            {
              t: "Verify",
              d: "Blood banks and hospitals update stock in one place. Every entry is checked and timestamped.",
            },
            {
              t: "Predict",
              d: "Our model reads usage, season and local events to forecast shortages days in advance.",
            },
            {
              t: "Notify",
              d: "The right hospital, bank or opted-in donor nearby gets a clear, timely alert.",
            },
          ].map((s, i) => (
            <li key={s.t} className="card-surface card-lift p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-heading font-extrabold text-secondary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Forecast */}
      <Section
        id="forecast"
        eyebrow="AI forecasting"
        title="See the shortage before it happens"
        intro="Stock of O− packed red cells across Mumbai. The dashed line is what our model expects next."
      >
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="card-surface p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-bold">O− stock, units</h3>
              <DemoBadge />
            </div>
            <ForecastChart />
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-chart-1" /> Actual
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 border-t-2 border-dashed border-primary" /> Predicted
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 border-t-2 border-dotted border-warning" /> Safe level
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[
              {
                to: "To hospital",
                i: Hospital,
                m: "O− platelets are now available at City Blood Bank, 3 km away.",
                t: "2 min ago",
              },
              {
                to: "To donor",
                i: Bell,
                m: "B+ blood is needed close to you. Reply only if you can.",
                t: "Just now",
              },
            ].map((n) => (
              <div key={n.to} className="card-surface card-lift flex gap-4 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent">
                  <n.i className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {n.to} · {n.t}
                  </p>
                  <p className="mt-1 font-medium">{n.m}</p>
                </div>
              </div>
            ))}
            <div className="rounded-3xl bg-warning-soft p-5 text-sm text-warning">
              <p className="font-bold">Early warning</p>
              <p className="mt-1">
                3 banks in Mumbai will drop below safe O− levels within 72 hours. 214 nearby donors
                can be alerted.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* NVIDIA */}
      <section className="bg-band text-band-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Accelerated with NVIDIA</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Fast enough to feel live</h2>
            <p className="mt-3 opacity-80">
              Forecasts and matches run on GPU-optimised models, so answers arrive while the caller
              is still on the line.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {["NVIDIA GPU", "TensorRT", "Edge deployment"].map((b) => (
                <li
                  key={b}
                  className="rounded-full border border-band-foreground/25 px-3 py-1 text-sm font-semibold"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            {[
              { l: "PyTorch inference", v: 120, w: "100%", c: "bg-band-foreground/35" },
              { l: "TensorRT inference", v: 18, w: "15%", c: "bg-primary" },
            ].map((b) => (
              <div key={b.l}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{b.l}</span>
                  <span>{b.v} ms</span>
                </div>
                <div className="mt-2 h-4 rounded-full bg-band-foreground/10">
                  <div className={`h-4 rounded-full ${b.c}`} style={{ width: b.w }} />
                </div>
              </div>
            ))}
            <p className="font-heading text-2xl font-extrabold">
              <Sparkles className="mr-2 inline h-5 w-5 text-primary" aria-hidden />
              about 6.7× faster
            </p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <Section id="trust" eyebrow="Trust" title="Built around consent and care">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              i: UserCheck,
              t: "Donors opt in",
              d: "No one is contacted unless they've said yes. Opt out anytime.",
            },
            {
              i: Lock,
              t: "Location stays private",
              d: "We share distance, never your exact address.",
            },
            {
              i: ShieldCheck,
              t: "Verified sources only",
              d: "Only licensed blood banks and hospitals can update stock.",
            },
            {
              i: Smile,
              t: "No pressure",
              d: "Alerts are requests, not demands. Saying no is always fine.",
            },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="card-surface card-lift p-6">
              <I className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-bold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="card-surface p-8 text-center sm:p-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Join BloodBridge</h2>

          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Sign in to access receiver search, donor registration, organization inventory and your
            dashboard.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/login" className="btn btn-primary">
              Login
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link to="/signup" className="btn btn-outline">
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
