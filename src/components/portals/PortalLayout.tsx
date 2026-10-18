import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

type PortalLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function PortalLayout({
  title,
  description,
  children,
}: PortalLayoutProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          to="/"
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Back to home
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
          {title}
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          {description}
        </p>
      </div>

      <nav
        aria-label="Portals"
        className="mb-8 flex flex-wrap gap-3"
      >
        <Link
          to="/receiver"
          className="btn btn-outline"
          activeProps={{ className: "ring-2 ring-primary" }}
        >
          Receiver
        </Link>

        <Link
          to="/donor"
          className="btn btn-outline"
          activeProps={{ className: "ring-2 ring-primary" }}
        >
          Volunteer
        </Link>

        <Link
          to="/workspace"
          className="btn btn-outline"
          activeProps={{ className: "ring-2 ring-primary" }}
        >
          Blood bank & hospital
        </Link>
      </nav>

      {children}
    </section>
  );
}