import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import BloodBankMap from "@/components/maps/BloodBankMap";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      {
        title: "Blood bank workspace – BloodBridge AI",
      },
      {
        name: "description",
        content: "Manage organization blood inventory by group, component, quantity and expiry.",
      },
    ],
  }),
  component: Workspace,
});

const API_URL = "http://localhost:8000";

const INVENTORY_ENDPOINT = `${API_URL}/api/organizations/me/inventory`;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const COMPONENT_OPTIONS = [
  {
    value: "whole_blood",
    label: "Whole blood",
  },
  {
    value: "red_cells",
    label: "Packed red cells",
  },
  {
    value: "platelets",
    label: "Platelets",
  },
  {
    value: "plasma",
    label: "Plasma",
  },
  {
    value: "cryoprecipitate",
    label: "Cryoprecipitate",
  },
] as const;

type Organization = {
  id: number;
  name: string;
  city: string;
  verification_status: string;
};

type InventoryRow = {
  id: number;
  blood_group: string;
  component: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  expires_at: string;
  stock_status: string;
};

type WorkspaceData = {
  organization: Organization | null;
  inventory: InventoryRow[];
};

type ValidationIssue = {
  loc?: (string | number)[];
  msg?: string;
};

function componentLabel(value: string) {
  return COMPONENT_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function errorMessage(status: number, data: unknown): string {
  if (status === 401) {
    return "Please log in to access your organization workspace.";
  }

  if (status === 403) {
    return "Access was denied. Check your organization membership and request permissions.";
  }

  if (status === 404) {
    return (
      "The inventory endpoint or your organization could not be found. " +
      "Organization registration and inventory APIs must be connected first."
    );
  }

  if (status === 405) {
    return "The inventory endpoint does not support this request method.";
  }

  const body = data as {
    detail?: string | ValidationIssue[];
    message?: string;
  } | null;

  if (Array.isArray(body?.detail)) {
    return body.detail
      .map((issue) => `${issue.loc?.join(".") ?? "request"}: ${issue.msg ?? "Invalid value"}`)
      .join("; ");
  }

  if (typeof body?.detail === "string") {
    return body.detail;
  }

  if (typeof body?.message === "string") {
    return body.message;
  }

  return `The request failed with status ${status}.`;
}

function expiryLabel(value: string) {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return "Unknown expiry";
  }

  return new Date(timestamp).toLocaleString();
}

function isExpired(value: string) {
  return Date.parse(value) <= Date.now();
}

function Workspace() {
  const [organization, setOrganization] = useState<Organization | null>(null);

  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    // Disable saving until organization access is confirmed again.
    setOrganization(null);
    setRows([]);

    try {
      const response = await fetch(INVENTORY_ENDPOINT, {
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(errorMessage(response.status, data));
      }

      if (!data || !Array.isArray(data.inventory) || !("organization" in data)) {
        throw new Error("The inventory API returned an unexpected response format.");
      }

      const workspace = data as WorkspaceData;

      if (!workspace.organization) {
        throw new Error(
          "No organization is linked to your account. " +
            "Complete organization registration before adding inventory.",
        );
      }

      setOrganization(workspace.organization);
      setRows(workspace.inventory);
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || loading || !organization) return;

    setSaveError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const quantity = Number(formData.get("units"));
    const expiryInput = String(formData.get("expiry") ?? "");
    const expiry = new Date(expiryInput);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setSaveError("Enter a whole-number quantity of at least 1.");
      return;
    }

    if (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now()) {
      setSaveError("Choose a future expiry date and time.");
      return;
    }

    const payload = {
       batch_reference: String(
    formData.get("batch_reference") ?? "",
  ).trim(),
      blood_group: String(formData.get("group") ?? ""),
      component: String(formData.get("component") ?? ""),
      quantity_on_hand: quantity,
      expires_at: expiry.toISOString(),
    };

    setSaving(true);

    try {
      const response = await fetch(INVENTORY_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(errorMessage(response.status, data));
      }

      setMessage("The server confirmed the inventory entry was saved.");

      // Show server data instead of manufacturing a local row.
      await loadInventory();
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to save inventory.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">
            {organization ? `${organization.name}, ${organization.city}` : "Organization workspace"}
          </p>

          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Inventory workspace</h1>

          {organization && (
            <p className="mt-2 text-sm text-muted-foreground">
              Verification status: {organization.verification_status}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void loadInventory()}
          disabled={loading || saving}
          className="btn btn-outline disabled:opacity-60"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      {loadError && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
        >
          {loadError}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <form className="card-surface space-y-4 p-6" onSubmit={handleSubmit} aria-busy={saving}>
          <h2 className="text-lg font-bold">Add inventory entry</h2>

          <p className="text-sm text-muted-foreground">
            Each submission adds a separate entry. It does not replace existing stock.
          </p>

          <fieldset disabled={loading || saving || !organization} className="space-y-4">
            <label className="block text-sm font-medium">
              Batch reference
              <input
                name="batch_reference"
                required
                maxLength={100}
                placeholder="Enter the recorded batch reference"
                className="field mt-1"
              />
            </label>
            <label className="block text-sm font-medium">
              Blood group
              <select name="group" required className="field mt-1">
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Component
              <select name="component" required className="field mt-1">
                {COMPONENT_OPTIONS.map((component) => (
                  <option key={component.value} value={component.value}>
                    {component.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Quantity in component units
              <input
                name="units"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={1}
                className="field mt-1"
              />
            </label>

            <label className="block text-sm font-medium">
              Expiry date and time
              <input name="expiry" type="datetime-local" required className="field mt-1" />
              <span className="mt-1 block text-xs text-muted-foreground">
                Enter the recorded expiry in your browser’s local time zone. Do not estimate it.
              </span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary w-full disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                "Add inventory"
              )}
            </button>
          </fieldset>

          {saveError && (
            <p role="alert" className="text-sm text-destructive">
              {saveError}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-success">
              {message}
            </p>
          )}
        </form>

        <section className="card-surface overflow-x-auto p-6" aria-busy={loading}>
          <h2 className="text-lg font-bold">Recorded inventory</h2>

          {loading ? (
            <p role="status" className="mt-4 text-sm">
              Loading inventory...
            </p>
          ) : loadError ? (
            <p className="mt-4 text-sm text-muted-foreground">Inventory could not be loaded.</p>
          ) : rows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No inventory entries have been saved for this organization.
            </p>
          ) : (
            <table className="mt-4 w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2">
                    Group
                  </th>
                  <th scope="col">Component</th>
                  <th scope="col">On hand</th>
                  <th scope="col">Reserved</th>
                  <th scope="col">Expiry</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="py-3 font-bold text-primary">{row.blood_group}</td>

                    <td>{componentLabel(row.component)}</td>
                    <td>{row.quantity_on_hand}</td>
                    <td>{row.quantity_reserved}</td>

                    <td className={isExpired(row.expires_at) ? "text-destructive" : ""}>
                      {expiryLabel(row.expires_at)}

                      {isExpired(row.expires_at) && <span className="block text-xs">Expired</span>}
                    </td>

                    <td>{row.stock_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <div className="mt-8">
      <BloodBankMap />
    </div>
      </div>
    </div>
  );
}
