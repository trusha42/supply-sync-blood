import { useMemo, useState, type FormEvent } from "react";

import BloodBankMap, { type FacilityLocation } from "@/components/maps/BloodBankMap";

import {
  BLOOD_GROUPS,
  CITIES,
  COMPONENT_OPTIONS,
  type BloodGroup,
  type City,
  type ComponentValue,
} from "@/lib/demo-data";

type Listing = {
  inventory_id: number;
  organization_id: number;
  organization_name: string;
  city: string;
  state: string;
  address: string | null;
  phone: string | null;
  verification_status: string;
  latitude: number | null;
  longitude: number | null;
  blood_group: string;
  component: string;
  available_quantity: number;
  updated_at: string;
  expires_at: string;
};

type ValidationIssue = {
  loc?: (string | number)[];
  msg?: string;
};

const API_URL = "http://localhost:8000";

function componentLabel(value: string) {
  return COMPONENT_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function RequestBloodCard() {
  const [city, setCity] = useState<City>("Pune");
  const [group, setGroup] = useState<BloodGroup>("A+");

  const [component, setComponent] = useState<ComponentValue>("whole_blood");

  const [quantity, setQuantity] = useState("2");
  const [results, setResults] = useState<Listing[]>([]);

  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  function clearResults() {
    setResults([]);
    setSearched(false);
    setError("");
  }

  const facilities = useMemo<FacilityLocation[]>(() => {
    const unique = new Map<number, FacilityLocation>();

    for (const listing of results) {
      const lat = listing.latitude;
      const lng = listing.longitude;

      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        continue;
      }

      unique.set(listing.organization_id, {
        id: listing.organization_id,
        name: listing.organization_name,
        city: listing.city,
        latitude: lat,
        longitude: lng,
        verification_status: listing.verification_status,
      });
    }

    return Array.from(unique.values());
  }, [results]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    const units = Number(quantity);

    clearResults();

    if (!Number.isInteger(units) || units < 1 || units > 100) {
      setError("Enter a whole-number quantity from 1 to 100.");
      return;
    }

    setBusy(true);

    const params = new URLSearchParams({
      city,
      blood_group: group,
      component,
      quantity: String(units),
    });

    try {
      const response = await fetch(`${API_URL}/api/inventory/search?${params.toString()}`, {
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to search inventory.");
        }

        if (response.status === 404) {
          throw new Error(
            "Inventory search API not found. " + "Add the backend endpoint and restart FastAPI.",
          );
        }

        if (Array.isArray(data?.detail)) {
          const message = data.detail
            .map(
              (issue: ValidationIssue) =>
                `${issue.loc?.join(".") ?? "request"}: ${issue.msg ?? "Invalid value"}`,
            )
            .join("; ");

          throw new Error(message);
        }

        throw new Error(
          typeof data?.detail === "string" ? data.detail : "The inventory search failed.",
        );
      }

      if (!Array.isArray(data?.listings)) {
        throw new Error("Unexpected inventory API response.");
      }

      setResults(data.listings);
      setSearched(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not connect to the backend.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="request"
      className="card-surface scroll-mt-24 p-5 sm:p-6"
      aria-labelledby="blood-search-title"
    >
      <h2 id="blood-search-title" className="text-xl font-bold">
        Find blood in your city
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Search recorded stock at verified hospitals and blood banks. This is not a reservation.
      </p>

      <form onSubmit={handleSearch} className="mt-5">
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium">
            City
            <select
              value={city}
              className="field mt-1"
              onChange={(event) => {
                setCity(event.target.value as City);
                clearResults();
              }}
            >
              {CITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Blood group
            <select
              value={group}
              className="field mt-1"
              onChange={(event) => {
                setGroup(event.target.value as BloodGroup);
                clearResults();
              }}
            >
              {BLOOD_GROUPS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Component
            <select
              value={component}
              className="field mt-1"
              onChange={(event) => {
                setComponent(event.target.value as ComponentValue);
                clearResults();
              }}
            >
              {COMPONENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Quantity in component units
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              required
              value={quantity}
              className="field mt-1"
              onChange={(event) => {
                setQuantity(event.target.value);
                clearResults();
              }}
            />
          </label>
        </fieldset>

        <button type="submit" disabled={busy} className="btn btn-primary mt-4 disabled:opacity-60">
          {busy ? "Searching..." : "Search inventory"}
        </button>
      </form>

      <div aria-live="polite" aria-busy={busy}>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {searched && results.length === 0 && (
          <p role="status" className="mt-5 text-sm">
            No matching inventory records were found in BloodBridge. This does not mean blood is
            unavailable elsewhere.
          </p>
        )}

        {searched && results.length > 0 && (
          <div className="mt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Showing {results.length} matching inventory entries, up to 50. Multiple entries may
              belong to one facility.
            </p>

            {facilities.length > 0 ? (
              <BloodBankMap facilities={facilities} />
            ) : (
              <p className="rounded-xl bg-muted p-4 text-sm">
                Matching stock was found, but facility coordinates have not been saved. See the
                results below.
              </p>
            )}

            {facilities.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Map markers show facilities with valid saved coordinates. Stock details are listed
                below.
              </p>
            )}

            <ul className="mt-5 space-y-4">
              {results.map((listing) => (
                <li
                  key={listing.inventory_id}
                  className="rounded-2xl border border-border p-4"
                >
                  <h3 className="font-semibold">
                    {listing.organization_name}
                  </h3>


                  <p className="mt-1 text-sm text-muted-foreground">
                    {listing.city}, {listing.state}
                  </p>


                  {/* Add this block */}
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Available quantity
                      </p>


                      <p className="mt-1 text-3xl font-extrabold text-primary">
                        {listing.available_quantity}
                        <span className="ml-1 text-sm font-medium text-muted-foreground">
                          units
                        </span>
                      </p>
                    </div>


                    <div className="rounded-xl bg-muted px-4 py-3">
                      <p className="text-sm font-semibold">
                        {listing.blood_group}
                      </p>


                      <p className="text-xs text-muted-foreground">
                        {componentLabel(listing.component)}
                      </p>
                    </div>
                  </div>


                  {listing.address && (
                    <p className="mt-2 text-sm">
                      Address: {listing.address}
                    </p>
                  )}


                  {listing.phone && (
                    <p className="mt-2 text-sm">
                      Facility contact: {listing.phone}
                    </p>
                  )}


                  <p className="mt-3 text-xs text-muted-foreground">
                    Stock updated: {formatTime(listing.updated_at)}
                  </p>


                  <p className="mt-1 text-xs text-muted-foreground">
                    Expires: {formatTime(listing.expires_at)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Confirm availability with the facility. Clinical suitability must be assessed by qualified
        medical staff. Searching does not submit a request or reserve stock.
      </p>
    </section>
  );
}
