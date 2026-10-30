import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
  UserRound,
} from "lucide-react";

type DonorProfileFormValues = {
  full_name: string;
  age: string;
  phone: string;
  gender: string;
  blood_group: string;
  city: string;
  is_available: boolean;
  notification_consent: boolean;
};

type CurrentUser = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
};

const bloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

const genderOptions = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
] as const;

const API_URL = "http://localhost:8000";

export function DonorProfileForm() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [values, setValues] =
    useState<DonorProfileFormValues>({
      full_name: "",
      age: "",
      phone: "",
      gender: "",
      blood_group: "",
      city: "",
      is_available: true,
      notification_consent: false,
    });

  const [loadingProfile, setLoadingProfile] =
    useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const meResponse = await fetch(
          `${API_URL}/api/auth/me`,
          {
            credentials: "include",
          },
        );

        if (!meResponse.ok) {
          throw new Error(
            "Log in to create or update your donor profile.",
          );
        }

        const currentUser: CurrentUser =
          await meResponse.json();

        const profileResponse = await fetch(
          `${API_URL}/api/donors/me`,
          {
            credentials: "include",
          },
        );

        if (!profileResponse.ok) {
          throw new Error(
            "Unable to load your donor profile.",
          );
        }

        const profileData =
          await profileResponse.json();

        if (active) {
          setUser(currentUser);

          if (profileData.profile) {
            setValues((current) => ({
              ...current,
              blood_group:
                profileData.profile.blood_group,
              city: profileData.profile.city,
              is_available:
                profileData.profile.is_available,
              notification_consent:
                profileData.profile
                  .notification_consent,
            }));
          }
        }
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to connect to the server.",
          );
        }
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function updateField<
    K extends keyof DonorProfileFormValues,
  >(
    field: K,
    value: DonorProfileFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess(false);
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    const age = Number(values.age);

    if (
      !values.full_name.trim() ||
      !values.phone.trim() ||
      !values.gender ||
      !values.blood_group ||
      !values.city.trim()
    ) {
      setError(
        "Please complete all required donor details.",
      );
      return;
    }

    if (
      !Number.isInteger(age) ||
      age < 18 ||
      age > 100
    ) {
      setError(
        "Enter a valid age between 18 and 100.",
      );
      return;
    }

    if (values.phone.trim().length < 10) {
      setError(
        "Enter a valid 10-digit mobile number.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/donors/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            full_name: values.full_name.trim(),
            age,
            phone: values.phone.trim(),
            gender: values.gender,
            blood_group: values.blood_group,
            city: values.city.trim(),
            is_available: values.is_available,
            notification_consent:
              values.notification_consent,
          }),
        },
      );

      if (!response.ok) {
        let message = `Could not save your donor profile. Server responded with ${response.status}.`;

        try {
          const data = await response.json();

          if (data.detail) {
            message =
              typeof data.detail === "string"
                ? data.detail
                : JSON.stringify(data.detail);
          }
        } catch {
          // Keep the default message.
        }

        throw new Error(message);
      }

      setSuccess(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <section className="card-surface p-6 sm:p-8">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2
            className="h-5 w-5 animate-spin text-primary"
            aria-hidden="true"
          />

          <p className="text-sm text-muted-foreground">
            Loading your donor profile...
          </p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="card-surface p-6 sm:p-8">
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            {error ||
              "Log in to create or update your donor profile."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="donor-form-title"
      className="card-surface p-6 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <UserRound
            className="h-5 w-5"
            aria-hidden="true"
          />
        </span>

        <div>
          <h2
            id="donor-form-title"
            className="text-xl font-bold"
          >
            Your donor profile
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user.email}. Add your donor
            details and availability.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="donor-name"
              className="mb-2 block text-sm font-medium"
            >
              Donor name
            </label>

            <input
              id="donor-name"
              type="text"
              value={values.full_name}
              onChange={(event) =>
                updateField(
                  "full_name",
                  event.target.value,
                )
              }
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="donor-age"
              className="mb-2 block text-sm font-medium"
            >
              Age
            </label>

            <input
              id="donor-age"
              type="number"
              min={18}
              max={100}
              value={values.age}
              onChange={(event) =>
                updateField(
                  "age",
                  event.target.value,
                )
              }
              placeholder="Enter your age"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="donor-phone"
              className="mb-2 block text-sm font-medium"
            >
              Mobile number
            </label>

            <input
              id="donor-phone"
              type="tel"
              value={values.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value,
                )
              }
              placeholder="Enter your mobile number"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="donor-gender"
              className="mb-2 block text-sm font-medium"
            >
              Gender
            </label>

            <select
              id="donor-gender"
              value={values.gender}
              onChange={(event) =>
                updateField(
                  "gender",
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">
                Select gender
              </option>

              {genderOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option
                    .replace(/_/g, " ")
                    .replace(
                      /\b\w/g,
                      (character) =>
                        character.toUpperCase(),
                    )}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="donor-blood-group"
              className="mb-2 block text-sm font-medium"
            >
              Blood group
            </label>

            <select
              id="donor-blood-group"
              value={values.blood_group}
              onChange={(event) =>
                updateField(
                  "blood_group",
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">
                Select blood group
              </option>

              {bloodGroups.map((group) => (
                <option
                  key={group}
                  value={group}
                >
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="donor-city"
              className="mb-2 block text-sm font-medium"
            >
              City
            </label>

            <input
              id="donor-city"
              type="text"
              value={values.city}
              onChange={(event) =>
                updateField(
                  "city",
                  event.target.value,
                )
              }
              placeholder="Enter your city"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">
              Availability
            </span>

            <label
              htmlFor="donor-availability"
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <span>
                {values.is_available
                  ? "Available to donate"
                  : "Currently unavailable"}
              </span>

              <input
                id="donor-availability"
                type="checkbox"
                checked={values.is_available}
                onChange={(event) =>
                  updateField(
                    "is_available",
                    event.target.checked,
                  )
                }
                className="h-5 w-5"
              />
            </label>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">
              Notifications
            </span>

            <label
              htmlFor="donor-notifications"
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <span>
                {values.notification_consent
                  ? "Matching alerts enabled"
                  : "Matching alerts disabled"}
              </span>

              <input
                id="donor-notifications"
                type="checkbox"
                checked={
                  values.notification_consent
                }
                onChange={(event) =>
                  updateField(
                    "notification_consent",
                    event.target.checked,
                  )
                }
                className="h-5 w-5"
              />
            </label>
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

        {success ? (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            Your donor profile has been saved.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Saving...
            </>
          ) : (
            <>
              <Save
                className="h-4 w-4"
                aria-hidden="true"
              />
              Save donor profile
            </>
          )}
        </button>
      </form>
    </section>
  );
}