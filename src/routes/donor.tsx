import { createFileRoute } from "@tanstack/react-router";

import {
  ArrowDown,
  ArrowRight,
  Bell,
  Clock3,
  HandHeart,
  Info,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { DonorProfileForm } from "@/components/donor-profile-form";
import PortalLayout from "@/components/portals/PortalLayout";
import { DonorProfileSearchCard } from "@/components/donor-profile-search";

export const Route = createFileRoute("/donor")({
  head: () => ({
    meta: [
      {
        title: "Donor Portal – BloodBridge AI",
      },
      {
        name: "description",
        content:
          "Create or find your donor profile, review availability details and manage notification preferences.",
      },
    ],
  }),
  component: DonorPage,
});

const donorSteps = [
  {
    icon: UserRound,
    number: "01",
    title: "Create your profile",
    description: "Add your name, blood group, city and availability.",
  },
  {
    icon: Search,
    number: "02",
    title: "Find your profile",
    description: "Search using your registered email or mobile number.",
  },
  {
    icon: Bell,
    number: "03",
    title: "Manage notifications",
    description: "Choose how and when you want to receive matching alerts.",
  },
] as const;

function DonorPage() {
  return (
    <PortalLayout
      title="Donor portal"
      description="Create or find your donor profile and manage your availability details."
    >
      <div className="space-y-8">
        {/* Introduction */}
        <section
          aria-labelledby="donor-intro-title"
          className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card p-6 sm:p-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <HandHeart className="h-4 w-4" aria-hidden="true" />
                Donor profile
              </span>

              <h2
                id="donor-intro-title"
                className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl"
              >
                A clearer way to manage your donor profile.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Create your donor profile, search your registered details, and choose how you
                receive matching notifications.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Search by email or mobile
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Availability details
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Privacy-conscious search
                </span>
              </div>
            </div>

            <a href="#create-donor-profile" className="btn btn-primary self-start lg:shrink-0">
              Manage profile
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* Workflow guidance */}
        <section aria-labelledby="donor-guide-title">
          <div className="mb-4 flex items-center gap-3">
            <h2 id="donor-guide-title" className="text-lg font-bold">
              How the donor portal works
            </h2>

            <div aria-hidden="true" className="h-px flex-1 bg-border" />
          </div>

          <ol className="grid gap-4 md:grid-cols-3">
            {donorSteps.map((step) => {
              const Icon = step.icon;

              return (
                <li key={step.number} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-xs font-bold tracking-widest text-muted-foreground"
                    >
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-4 font-bold">{step.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Create donor profile */}
        <section
          id="create-donor-profile"
          aria-label="Create donor profile"
          className="scroll-mt-48"
        >
          <DonorProfileForm />
        </section>

        {/* Find donor profile */}
        <section id="donor-profile" aria-label="Your donor profile" className="scroll-mt-48">
          <DonorProfileSearchCard />
        </section>

        {/* Supporting sections */}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section aria-labelledby="notification-title" className="card-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </span>

              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                Coming next
              </span>
            </div>

            <h2 id="notification-title" className="mt-4 text-xl font-bold">
              Notification preferences
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Once connected, this section will let you manage matching alerts and communication
              preferences.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              Notification settings are not connected on this page yet.
            </div>
          </section>

          <section aria-labelledby="donor-support-title" className="card-surface p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>

            <h2 id="donor-support-title" className="mt-4 text-xl font-bold">
              Need help finding your profile?
            </h2>

            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Use the email or mobile number registered with BloodBridge.",
                "Check that your city and blood group details are correct.",
                "Contact your organization if your profile cannot be found.",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2.5">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="leading-6">{text}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
              BloodBridge helps donors find and manage profile information. Eligibility and donation
              suitability must be assessed by qualified medical staff.
            </p>
          </section>
        </div>
      </div>
    </PortalLayout>
  );
}
