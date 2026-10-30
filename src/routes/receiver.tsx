import { createFileRoute } from "@tanstack/react-router";

import {
  ArrowDown,
  ArrowRight,
  ClipboardList,
  Clock3,
  HeartPulse,
  Info,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";

import PortalLayout from "@/components/portals/PortalLayout";

import { AskBloodBridge } from "@/components/ask-bloodbridge";

import { RequestBloodCard } from "@/components/request-blood";

export const Route = createFileRoute("/receiver")({
  head: () => ({
    meta: [

      {
        title: "Receiver Portal – BloodBridge AI",
      },
      {
        name: "description",
        content:
          "Search recorded blood inventory at participating hospitals and blood banks by city, blood group and component.",
      },
    ],
  }),
  component: ReceiverPage,
});

const searchSteps = [
  {
    icon: Search,
    number: "01",
    title: "Enter your requirement",
    description:
      "Choose a city, blood group, component and quantity.",
  },
  {
    icon: MapPin,
    number: "02",
    title: "Review recorded matches",
    description:
      "Compare facilities, stock quantities and update timestamps.",
  },
  {
    icon: Phone,
    number: "03",
    title: "Confirm with the facility",
    description:
      "Contact the facility before making collection arrangements.",
  },
] as const;

function ReceiverPage() {
  return (
    <PortalLayout
      title="Receiver portal"
      description="Search recorded availability and find facility details in one place."
    >
      <div className="space-y-8">
        {/* Introduction */}
        <section
          aria-labelledby="receiver-intro-title"
          className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card p-6 sm:p-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <HeartPulse
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Blood inventory search
              </span>

              <h2
                id="receiver-intro-title"
                className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl"
              >
                A clearer way to find recorded availability.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Search participating hospitals and blood banks,
                review matching inventory, and check the details
                before contacting a facility.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                  <MapPin
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  City-based search
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                  <Clock3
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Stock-update timestamps
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                  <ShieldCheck
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Verified-organization filter
                </span>
              </div>
            </div>

            <a
              href="#receiver-search"
              className="btn btn-primary self-start lg:shrink-0"
            >
              Start your search
              <ArrowDown
                className="h-4 w-4"
                aria-hidden="true"
              />
            </a>
          </div>
        </section>

        {/* Search guidance */}
        <section aria-labelledby="search-guide-title">
          <div className="mb-4 flex items-center gap-3">
            <h2
              id="search-guide-title"
              className="text-lg font-bold"
            >
              From search to confirmation
            </h2>

            <div
              aria-hidden="true"
              className="h-px flex-1 bg-border"
            />
          </div>

          <ol className="grid gap-4 md:grid-cols-3">
            {searchSteps.map((step) => {
              const Icon = step.icon;

              return (
                <li
                  key={step.number}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-xs font-bold tracking-widest text-muted-foreground"
                    >
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-4 font-bold">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Main search and results */}
        <section
          id="receiver-search"
          aria-label="Search blood inventory"
          className="scroll-mt-48"
        >
          <RequestBloodCard />
        </section>

        {/* Supporting information */}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="request-tracking-title"
            className="card-surface p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <ClipboardList
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                Not connected yet
              </span>
            </div>

            <h2
              id="request-tracking-title"
              className="mt-4 text-xl font-bold"
            >
              My requests
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Request submission and status tracking are not
              connected on this page yet. Searching inventory
              does not create a blood request.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <Info
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              No request is submitted by the search form above.
            </div>
          </section>

          <section
            aria-labelledby="confirmation-guide-title"
            className="card-surface p-6"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Phone
                className="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <h2
              id="confirmation-guide-title"
              className="mt-4 text-xl font-bold"
            >
              Before making arrangements
            </h2>

            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Check the inventory update time and expiry.",
                "Confirm current availability with the facility.",
                "Ask the facility about its request and collection process.",
              ].map((text) => (
                <li
                  key={text}
                  className="flex items-start gap-2.5"
                >
                  <ArrowRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="leading-6">
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
              Recorded availability is not a reservation.
              Clinical suitability must be assessed by qualified
              medical staff.
            </p>
          </section>
        </div>
      </div>
    </PortalLayout>
  );
}
function Receiver() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div>
        <p className="eyebrow">Receiver portal</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">I need blood</h1>
        <p className="mt-2 text-muted-foreground">Type what you need in your own words. A person reviews every alert before it goes out.</p>
      </div>
      <div className="card-surface p-5 sm:p-6">
        <h2 className="mb-4 text-xl font-bold">Ask BloodBridge</h2>
        <AskBloodBridge />
      </div>
      <RequestBloodCard/>
    </div>
  );
}
