import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, HeartPulse, Loader2 } from "lucide-react";
import { AuthApiError, submitAuth } from "@/lib/auth-api";

type AuthFormProps = {
  mode: "login" | "signup";
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 " +
  "text-foreground outline-none transition focus:border-primary " +
  "focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export default function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (lockedUntil === null) return;

    const tick = () => {
      const current = Date.now();
      setNow(current);

      if (current >= lockedUntil) {
        setLockedUntil(null);
        setError("");
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const locked = lockedUntil !== null;

  const secondsLeft = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy || locked) return;

    setError("");
    setSuccess("");

    if (isSignup && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (isSignup && password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (isSignup && password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const result = await submitAuth(mode, {
        email: email.trim(),
        password,
        ...(isSignup ? { name: name.trim() } : {}),
      });

      if (isSignup) {
        setSuccess(result.message || "Account created. You can now log in.");
        setPassword("");
        setConfirmation("");
      } else {
        await navigate({ to: "/home" });
      }
    } catch (caught) {
      if (caught instanceof AuthApiError) {
        const timestamp = caught.data.locked_until ? Date.parse(caught.data.locked_until) : NaN;

        if (!isSignup && Number.isFinite(timestamp) && timestamp > Date.now()) {
          setNow(Date.now());
          setLockedUntil(timestamp);
          setError(
            caught.data.message || "Too many failed login attempts. Try again after 72 hours.",
          );
        } else {
          const remaining = caught.data.attempts_remaining;

          setError(
            caught.message +
              (!isSignup && typeof remaining === "number"
                ? ` ${remaining} attempt(s) remaining.`
                : ""),
          );
        }
      } else {
        setError("Could not connect to the server. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby={`${mode}-title`}
      className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-12 sm:py-16"
    >
      <div className="card-surface w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-coral-soft text-primary">
            <HeartPulse className="h-7 w-7" aria-hidden="true" />
          </span>

          <h1 id={`${mode}-title`} className="mt-4 text-3xl font-extrabold">
            {isSignup ? "Join BloodBridge" : "Welcome back"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Create an account to join the network."
              : "Log in to your BloodBridge account."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {locked && (
          <p className="mb-5 text-sm text-muted-foreground">
            Time remaining: {hours}h {minutes}m {seconds}s. This account is temporarily locked.
          </p>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {success}{" "}
            <Link to="/login" className="underline">
              Go to login
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={busy || locked} className="space-y-5">
            <legend className="sr-only">{isSignup ? "Create an account" : "Login details"}</legend>

            {isSignup && (
              <div>
                <label htmlFor={`${mode}-name`} className="text-sm font-semibold">
                  Full name
                </label>
                <input
                  id={`${mode}-name`}
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="Enter your full name"
                  required
                  maxLength={100}
                />
              </div>
            )}

            <div>
              <label htmlFor={`${mode}-email`} className="text-sm font-semibold">
                Email address
              </label>
              <input
                id={`${mode}-email`}
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor={`${mode}-password`} className="text-sm font-semibold">
                Password
              </label>

              <div className="relative">
                <input
                  id={`${mode}-password`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
                  minLength={isSignup ? 8 : undefined}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 mt-2 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label htmlFor="signup-confirmation" className="text-sm font-semibold">
                  Confirm password
                </label>

                <input
                  id="signup-confirmation"
                  name="confirmation"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className={inputClass}
                  placeholder="Re-enter your password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={busy || locked}
              className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}

              {busy
                ? "Please wait..."
                : locked
                  ? "Account temporarily locked"
                  : isSignup
                    ? "Create account"
                    : "Login"}
            </button>
          </fieldset>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "New to BloodBridge? "}
          <Link
            to={isSignup ? "/login" : "/signup"}
            className="font-semibold text-primary hover:underline"
          >
            {isSignup ? "Login" : "Sign up"}
          </Link>
        </p>
      </div>
    </section>
  );
}
