import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Search } from "lucide-react";
import PortalLayout from "@/components/portals/PortalLayout";
import { RequestBloodCard } from "@/components/request-blood";

export const Route = createFileRoute("/receiver")({
  head: () => ({
    meta: [{ title: "Receiver Portal – BloodBridge AI" }],
  }),
  component: ReceiverPage,
});

function ReceiverPage() {
  return (
    <PortalLayout
      title="Receiver portal"
      description="Submit a blood requirement and track its progress."
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <RequestBloodCard />

        <div className="space-y-6">
          <section className="card-surface p-6">
            <ClipboardList
              className="h-6 w-6 text-primary"
              aria-hidden="true"
            />

            <h2 className="mt-4 text-xl font-bold">
              My requests
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Your submitted requests and their status will appear here
              after the requests API is connected.
            </p>
          </section>

          <section className="card-surface p-6">
            <Search
              className="h-6 w-6 text-primary"
              aria-hidden="true"
            />

            <h2 className="mt-4 text-xl font-bold">
              Matching blood banks
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Matches will appear after a request is submitted and
              inventory matching is connected.
            </p>
          </section>
        </div>
      </div>
    </PortalLayout>
  );
}