import { Link, useRouterState } from "@tanstack/react-router";
import { Droplet, Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";

const landingLinks = [
  { href: "/#how", label: "How it works" },
  { href: "/#portals", label: "Portals" },
  { href: "/#forecast", label: "Forecasting" },
  { href: "/#trust", label: "Trust" },
];

const appLinks = [
  { to: "/home", label: "Home" },
  { to: "/receiver", label: "Receiver" },
  { to: "/donor", label: "Volunteer" },
  { to: "/workspace", label: "Organization" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

function isApplicationPath(pathname: string) {
  return appLinks.some(
    ({ to }) =>
      pathname === to || pathname.startsWith(`${to}/`),
  );
}

export function Logo() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const destination = isApplicationPath(pathname) ? "/home" : "/";

  return (
    <Link
      to={destination}
      className="flex items-center gap-2 font-heading text-lg font-extrabold"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral-soft text-primary">
        <Droplet
          className="h-5 w-5 fill-current"
          aria-hidden="true"
        />
      </span>

      BloodBridge AI
    </Link>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedDark = localStorage.getItem("bb-theme") === "dark";

    setDark(savedDark);
    document.documentElement.classList.toggle("dark", savedDark);
  }, []);

  function toggle() {
    const nextDark = !dark;

    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);

    localStorage.setItem(
      "bb-theme",
      nextDark ? "dark" : "light",
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        dark ? "Switch to light mode" : "Switch to dark mode"
      }
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-accent"
    >
      {dark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isAppPage = isApplicationPath(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Logo />

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card lg:hidden"
            aria-label={
              open ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Allow navigation and account controls to wrap independently. */}
        <div className="flex w-full flex-wrap items-center justify-end gap-4 lg:justify-between">
          <nav
            aria-label="Main"
            className="hidden flex-wrap items-center gap-4 text-sm font-medium lg:flex"
          >
            {isAppPage ? (
              appLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  activeOptions={{
                    exact: item.to === "/home",
                  }}
                  activeProps={{
                    className: "bg-primary/10 text-primary",
                  }}
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <>
                {landingLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ))}
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {!isAppPage && (
              <a
                href="/#request"
                className="btn btn-primary hidden sm:inline-flex"
              >
                Find blood
              </a>
            )}

            <UserMenu />
          </div>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile"
          className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden"
        >
          {isAppPage ? (
            appLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                activeOptions={{
                  exact: item.to === "/home",
                }}
                activeProps={{
                  className: "bg-primary/10 text-primary",
                }}
              >
                {item.label}
              </Link>
            ))
          ) : (
            <>
              {landingLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="/#request"
                onClick={() => setOpen(false)}
                className="btn btn-primary mt-2"
              >
                Find blood
              </a>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <Logo />

        <nav
          aria-label="Project links"
          className="flex flex-wrap gap-5 text-sm font-medium"
        >
          <a
            href="https://devpost.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary"
          >
            DevPost
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary"
          >
            GitHub
          </a>

          <a
            href="https://youtube.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary"
          >
            Demo video
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function DemoBadge() {
  return (
    <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
      Demo data
    </span>
  );
}