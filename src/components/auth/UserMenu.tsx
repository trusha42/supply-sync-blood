import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";

type CurrentUser = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
};

const API_URL = "http://localhost:8000";

export default function UserMenu() {
  const navigate = useNavigate();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadUser() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          if (active) setUser(null);
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to check your login session.");
        }

        const currentUser: CurrentUser = await response.json();

        if (active) {
          setUser(currentUser);
        }
      } catch (caught) {
        if (!active || controller.signal.aborted) return;

        setUser(null);
        setError(caught instanceof Error ? caught.message : "Unable to connect to the server.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadUser();

    return () => {
      active = false;
      controller.abort();
    };
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      setUser(null);
      await navigate({ to: "/login" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {loading ? (
        <span role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking session...
        </span>
      ) : user ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className="max-w-48 truncate text-sm font-semibold" title={user.full_name}>
            Hello, {user.full_name} <span aria-hidden="true">👋</span>
          </span>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-outline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}

            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn btn-outline">
            Login
          </Link>

          <Link to="/signup" className="btn btn-primary">
            Sign Up
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="max-w-xs text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
