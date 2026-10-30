import { useEffect, useRef, useState } from "react";
import type {
  LayerGroup,
  Map as LeafletMap,
} from "leaflet";

import "leaflet/dist/leaflet.css";

export type FacilityLocation = {
  id: number;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  verification_status: string;
};

type Props = {
  facilities?: FacilityLocation[];
};

const EMPTY_FACILITIES: FacilityLocation[] = [];

export default function BloodBankMap({
  facilities = EMPTY_FACILITIES,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<LeafletMap | null>(null);
  const locationLayerRef = useRef<LayerGroup | null>(null);

  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;

    setReady(false);
    setError("");

    async function initializeMap() {
      try {
        const L = await import("leaflet");

        if (cancelled || !containerRef.current) return;

        const map = L.map(containerRef.current).setView(
          [22.5, 79],
          5,
        );

        mapRef.current = map;

        dispose = () => {
          mapRef.current = null;
          locationLayerRef.current = null;
          map.remove();
        };

        L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        ).addTo(map);

        locationLayerRef.current = L.layerGroup().addTo(map);

        setReady(true);
        map.invalidateSize();
      } catch {
        dispose?.();

        if (!cancelled) {
          setError("The map could not be initialized.");
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    let markerLayer: LayerGroup | undefined;

    async function displayFacilities() {
      const L = await import("leaflet");

      if (cancelled || !mapRef.current) return;

      const map = mapRef.current;
      markerLayer = L.layerGroup().addTo(map);

      const bounds = L.latLngBounds([]);

      for (const facility of facilities) {
        const { latitude, longitude } = facility;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          continue;
        }

        // Use textContent rather than treating API data as HTML.
        const popup = document.createElement("div");

        const heading = document.createElement("strong");
        heading.textContent = facility.name;

        const city = document.createElement("p");
        city.textContent = facility.city;

        const verification = document.createElement("p");
        verification.textContent =
          `Verification: ${facility.verification_status}`;

        popup.append(heading, city, verification);

        L.circleMarker([latitude, longitude], {
          radius: 9,
          color: "#b91c1c",
          fillColor: "#ef4444",
          fillOpacity: 0.85,
          weight: 2,
        })
          .bindPopup(popup)
          .addTo(markerLayer);

        bounds.extend([latitude, longitude]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: 13,
        });
      }
    }

    void displayFacilities().catch(() => {
      if (!cancelled) {
        setError("Facility markers could not be displayed.");
      }
    });

    return () => {
      cancelled = true;
      markerLayer?.remove();
    };
  }, [facilities, ready]);

  function useMyLocation() {
    const map = mapRef.current;

    if (!map || locating) return;

    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const L = await import("leaflet");

          // Ignore a result arriving after this map was removed.
          if (mapRef.current !== map) return;

          const { latitude, longitude, accuracy } =
            position.coords;

          const layer = locationLayerRef.current;

          if (!layer) return;

          layer.clearLayers();

          L.circle([latitude, longitude], {
            radius: accuracy,
            color: "#2563eb",
            fillOpacity: 0.08,
            weight: 1,
          }).addTo(layer);

          L.circleMarker([latitude, longitude], {
            radius: 8,
            color: "#ffffff",
            fillColor: "#2563eb",
            fillOpacity: 1,
            weight: 2,
          })
            .bindPopup(
              `Your reported location — accuracy approximately ${
                Math.round(accuracy)
              } metres.`,
            )
            .addTo(layer)
            .openPopup();

          map.setView([latitude, longitude], 13);
        } catch {
          if (mapRef.current === map) {
            setError("Your location could not be displayed.");
          }
        } finally {
          if (mapRef.current === map) {
            setLocating(false);
          }
        }
      },
      (locationError) => {
        if (mapRef.current !== map) return;

        setLocating(false);

        setError(
          locationError.code === 1
            ? "Location permission was denied. You can still browse the map."
            : "Your location is unavailable or the request timed out.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  }

  return (
    <section className="card-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-xl font-bold">
            BloodBridge map
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Browse facility locations or center the map on yourself.
          </p>
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={!ready || locating}
          className="btn btn-primary disabled:opacity-60"
        >
          {locating ? "Finding location..." : "Use my location"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="px-5 pb-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div
        ref={containerRef}
        role="region"
        aria-label="Facility location map"
        style={{
          height: "420px",
          width: "100%",
          position: "relative",
          zIndex: 0,
        }}
      />

      <div className="space-y-2 p-5 text-sm text-muted-foreground">
        <p>
          “Use my location” displays your location in this browser.
          This component does not upload it to the backend.
        </p>

        {facilities.length === 0 && (
          <p>
            No facility locations have been supplied yet.
            The background map is not a list of registered
            BloodBridge organizations.
          </p>
        )}
      </div>
    </section>
  );
}