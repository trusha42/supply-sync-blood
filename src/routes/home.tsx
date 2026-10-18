import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  HandHeart,
  HeartPulse,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [{ title: "Home – BloodBridge AI" }],
  }),
  component: HomePage,
});

type CurrentUser = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
};

const API_URL = "http://localhost:8000";

function HomePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadUser() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          if (active) {
            await navigate({
              to: "/login",
              replace: true,
            });
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load your account.");
        }

        const currentUser: CurrentUser = await response.json();

        if (active) {
          setUser(currentUser);
        }
      } catch (caught) {
        if (!active || controller.signal.aborted) return;

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to connect to the server.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadUser();

    return () => {
      active = false;
      controller.abort();
    };
  }, [navigate]);

  if (loading) {
    return (
      <section
        role="status"
        className="flex min-h-[60vh] items-center justify-center gap-3 px-4"
      >
        <Loader2
          className="h-6 w-6 animate-spin text-primary"
          aria-hidden="true"
        />
        <p>Loading your home page...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16">
        <div className="card-surface p-8 text-center">
          <h1 className="text-2xl font-bold">
            Could not load your account
          </h1>

          <p role="alert" className="mt-3 text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-6"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!user) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
        <p className="eyebrow">Your BloodBridge home</p>

        <h1 className="mt-3 break-words text-3xl font-extrabold sm:text-4xl">
          Welcome, {user.full_name}!{" "}
          <span aria-hidden="true">👋</span>
        </h1>

        <p className="mt-4 max-w-2xl text-muted-foreground">
          Find the right place to request blood, volunteer, or manage
          your organization.
        </p>
      </div>

      <h2 className="mt-10 text-2xl font-bold">
        What would you like to do?
      </h2>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <article className="card-surface card-lift flex flex-col p-6">
          <HeartPulse
            className="h-8 w-8 text-primary"
            aria-hidden="true"
          />

          <h3 className="mt-5 text-xl font-bold">
            Receiver portal
          </h3>

          <p className="mt-3 flex-1 text-sm text-muted-foreground">
            Submit a blood requirement and track your requests.
          </p>

          <Link to="/receiver" className="btn btn-primary mt-6">
            Request blood
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </article>

        <article className="card-surface card-lift flex flex-col p-6">
          <HandHeart
            className="h-8 w-8 text-primary"
            aria-hidden="true"
          />

          <h3 className="mt-5 text-xl font-bold">
            Volunteer portal
          </h3>

          <p className="mt-3 flex-1 text-sm text-muted-foreground">
            Manage your donor profile, availability, and notification
            preferences.
          </p>

          <Link to="/donor" className="btn btn-primary mt-6">
            Open volunteer portal
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </article>

        <article className="card-surface card-lift flex flex-col p-6">
          <Building2
            className="h-8 w-8 text-primary"
            aria-hidden="true"
          />

          <h3 className="mt-5 text-xl font-bold">
            Blood bank & hospital
          </h3>

          <p className="mt-3 flex-1 text-sm text-muted-foreground">
            Access your organization workspace. Verified membership
            is required for operational actions.
          </p>

          <Link to="/workspace" className="btn btn-primary mt-6">
            Open workspace
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </article>
      </div>

      <div className="card-surface mt-8 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Network dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore the network overview and forecasting displays.
          </p>
        </div>

        <Link to="/dashboard" className="btn btn-outline shrink-0">
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          View dashboard
        </Link>
      </div>
    </section>
  );
}