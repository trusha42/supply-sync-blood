import { useState } from "react";

import {
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type DonorResult = {
  user_id: number;
  full_name: string;
  mobile_number: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string;
  city: string;
  state: string | null;
  is_available: boolean;
};

const API_URL = "http://localhost:8000";

export function DonorProfileSearchCard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    DonorResult[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] =
    useState(false);

  async function handleSearch(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    const value = query.trim();

    if (value.length < 3) {
      setError(
        "Enter at least 3 characters of a name or a mobile number.",
      );
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setHasSearched(true);

    try {
      const response = await fetch(
        `${API_URL}/api/donors/search?q=${encodeURIComponent(
          value,
        )}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to search donor profiles. Please try again.",
        );
      }

      const data = await response.json();
      setResults(data.donors);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="donor-search-title"
      className="card-surface p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <UserRound
              className="h-4 w-4"
              aria-hidden="true"
            />
            Find donor profiles
          </span>

          <h2
            id="donor-search-title"
            className="mt-4 text-2xl font-bold"
          >
            Search available donors
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Search by donor name or registered mobile
            number. Only active, available donor profiles
            are shown.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="w-full max-w-md space-y-4"
        >
          <div>
            <label
              htmlFor="donor-search-input"
              className="mb-2 block text-sm font-medium"
            >
              Donor name or mobile number
            </label>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <input
                id="donor-search-input"
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Bhavana or 9876543210"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Searching...
              </>
            ) : (
              <>
                <Search
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Search donors
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 border-t border-border pt-8">
        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-muted p-8">
            <Loader2
              className="h-5 w-5 animate-spin text-primary"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Searching donor profiles...
            </p>
          </div>
        ) : results.length > 0 ? (
          <ul className="space-y-4">
            {results.map((donor) => (
              <li
                key={donor.user_id}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      {donor.full_name}
                    </h3>

                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      {donor.city}
                      {donor.state
                        ? `, ${donor.state}`
                        : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {donor.blood_group}
                      </span>

                      {donor.age !== null ? (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          Age {donor.age}
                        </span>
                      ) : null}

                      {donor.gender ? (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize text-muted-foreground">
                          {donor.gender}
                        </span>
                      ) : null}

                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                        Available
                      </span>
                    </div>
                  </div>

                  {donor.mobile_number ? (
                    <div className="rounded-xl bg-muted p-4 text-sm">
                      <p className="font-medium">
                        Contact
                      </p>

                      <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                        <Phone
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        {donor.mobile_number}
                      </p>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : hasSearched ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted p-8 text-center">
            <UserRound
              className="mx-auto h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />

            <h3 className="mt-4 font-bold">
              No matching donor profiles
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Check the spelling of the name or verify the
              mobile number. Only available donor profiles
              are included.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted p-8 text-center">
            <Search
              className="mx-auto h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />

            <h3 className="mt-4 font-bold">
              Start a donor search
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Enter a donor name or mobile number to find
              available donor profiles.
            </p>

            <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck
                className="h-4 w-4"
                aria-hidden="true"
              />
              Donor search is available to signed-in users.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}