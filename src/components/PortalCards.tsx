import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  HandHeart,
  HeartPulse,
} from "lucide-react";

const portals = [
  {
    icon: HeartPulse,
    title: "Receiver portal",
    description:
      "Search recorded blood inventory by city, blood group and component.",
    button: "Find blood",
    to: "/receiver",
  },
  {
    icon: HandHeart,
    title: "Volunteer portal",
    description:
      "Create or update your donor profile and contact preferences.",
    button: "Manage donor profile",
    to: "/donor",
  },
  {
    icon: Building2,
    title: "Organization workspace",
    description:
      "Manage inventory for the organization linked to your account.",
    button: "Open workspace",
    to: "/workspace",
  },
] as const;

export default function PortalCards() {
  return (
    <section
      aria-labelledby="portals-heading"
      className="mt-10"
    >
      <h2
        id="portals-heading"
        className="text-2xl font-extrabold"
      >
        Your portals
      </h2>

      <p className="mt-2 text-muted-foreground">
        Choose what you would like to do.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {portals.map((portal) => {
          const Icon = portal.icon;

          return (
            <div
              key={portal.to}
              className="card-surface card-lift flex flex-col p-6"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral-soft text-primary">
                <Icon
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </span>

              <h3 className="mt-5 text-xl font-bold">
                {portal.title}
              </h3>

              <p className="mt-2 flex-1 text-muted-foreground">
                {portal.description}
              </p>

              <Link
                to={portal.to}
                className="btn btn-outline mt-6 self-start"
              >
                {portal.button}
                <ArrowRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}