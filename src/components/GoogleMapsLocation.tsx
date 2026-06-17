import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin, Loader2, Navigation, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export type TestingStation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // km
  availability: "available" | "limited" | "unavailable";
  phone?: string;
  hours?: string;
};

export type GoogleMapsLocationProps = {
  onLocationCapture?: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address: string;
    selectedStation?: {
      id: string;
      name: string;
      address: string;
      distance: number;
    };
  }) => void;
  appId?: string;
};

const DURBAN_TESTING_STATIONS: Omit<TestingStation, "distance">[] = [
  {
    id: "station_001",
    name: "Durban City Testing Centre",
    address: "87 Field Street, Durban Central, 4001",
    latitude: -29.8587,
    longitude: 31.0192,
    availability: "available",
    phone: "031 306 8600",
    hours: "Mon–Fri · 08:00 – 16:00",
  },
  {
    id: "station_002",
    name: "Pinetown Regional Testing Station",
    address: "123 Main Road, Pinetown, 3610",
    latitude: -29.8074,
    longitude: 30.8686,
    availability: "available",
    phone: "031 701 2000",
    hours: "Mon–Fri · 08:00 – 16:00",
  },
  {
    id: "station_003",
    name: "Westville Testing Facility",
    address: "45 Argyle Road, Westville, 3630",
    latitude: -29.8485,
    longitude: 30.8274,
    availability: "limited",
    phone: "031 268 9000",
    hours: "Mon–Thu · 08:00 – 16:00 · Fri 08:00 – 13:00",
  },
  {
    id: "station_004",
    name: "Umbogintwini Testing Office",
    address: "89 Old Main Road, Umbogintwini, 4170",
    latitude: -29.99,
    longitude: 30.8976,
    availability: "available",
    phone: "031 916 3000",
    hours: "Mon–Fri · 08:00 – 16:00",
  },
  {
    id: "station_005",
    name: "Durban North Testing Centre",
    address: "234 Ridge Road, Durban North, 4051",
    latitude: -29.7876,
    longitude: 31.0246,
    availability: "available",
    phone: "031 563 8000",
    hours: "Mon–Fri · 08:00 – 16:00",
  },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function availabilityClass(a: string) {
  switch (a) {
    case "available":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "limited":
      return "bg-amber-100 text-amber-800 border-amber-300";
    default:
      return "bg-red-100 text-red-800 border-red-300";
  }
}

export function GoogleMapsLocation({ onLocationCapture }: GoogleMapsLocationProps) {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    address: string;
  } | null>(null);
  const [stations, setStations] = useState<TestingStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<TestingStation | null>(null);

  const handleGetLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported by your browser.");
      return;
    }
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const address = `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`;
        const loc = {
          latitude,
          longitude,
          ...(typeof accuracy === "number" ? { accuracy } : {}),
          address,
        };
        setUserLocation(loc);

        const ranked = DURBAN_TESTING_STATIONS.map((s) => ({
          ...s,
          distance: calculateDistance(latitude, longitude, s.latitude, s.longitude),
        })).sort((a, b) => a.distance - b.distance);
        setStations(ranked);

        onLocationCapture?.(loc);
        toast.success("Location captured. Now select a testing station below.");
        setIsLoading(false);
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser settings."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Location information is unavailable."
              : err.code === err.TIMEOUT
                ? "Request to get location timed out."
                : "Could not get your location.";
        setError(msg);
        toast.error(msg);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const handleSelectStation = (station: TestingStation) => {
    setSelectedStation(station);
    if (!userLocation) return;
    onLocationCapture?.({
      ...userLocation,
      selectedStation: {
        id: station.id,
        name: station.name,
        address: station.address,
        distance: station.distance,
      },
    });
  };

  // Build an OpenStreetMap embed bbox around the user + stations.
  const mapSrc = (() => {
    if (!userLocation) return null;
    const pts = [
      [userLocation.latitude, userLocation.longitude],
      ...stations.slice(0, 5).map((s) => [s.latitude, s.longitude] as [number, number]),
    ];
    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    const pad = 0.02;
    const bbox = [
      Math.min(...lngs) - pad,
      Math.min(...lats) - pad,
      Math.max(...lngs) + pad,
      Math.max(...lats) + pad,
    ].join(",");
    const marker = `${userLocation.latitude},${userLocation.longitude}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  })();

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" /> Step 1 · Share your location
          </CardTitle>
          <CardDescription>
            We use your GPS only to rank the closest testing stations. Nothing is shared
            publicly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Location error</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleGetLocation}
            disabled={isLoading}
            className="w-full"
            size="lg"
            variant={userLocation ? "outline" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Getting location…
              </>
            ) : userLocation ? (
              <>
                <Navigation className="mr-2 h-4 w-4" /> Refresh location
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-4 w-4" /> Use my current location
              </>
            )}
          </Button>

          {userLocation && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              <p className="flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Location captured
              </p>
              <p className="mt-1">{userLocation.address}</p>
              {typeof userLocation.accuracy === "number" && (
                <p>Accuracy: ±{Math.round(userLocation.accuracy)} m</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {mapSrc && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Map view</CardTitle>
            <CardDescription>You are pinned at the centre. Stations are listed below.</CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              title="Nearby testing stations"
              src={mapSrc}
              className="h-72 w-full rounded-md border"
              loading="lazy"
            />
          </CardContent>
        </Card>
      )}

      {stations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5" /> Step 2 · Choose a testing station
            </CardTitle>
            <CardDescription>
              Tap a station to select it. The closest stations appear first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stations.map((station, i) => {
                const isSelected = selectedStation?.id === station.id;
                return (
                  <button
                    type="button"
                    key={station.id}
                    onClick={() => handleSelectStation(station)}
                    className={`w-full rounded-md border p-3 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                            {i + 1}
                          </span>
                          <h3 className="text-sm font-semibold">{station.name}</h3>
                          {isSelected && (
                            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-primary">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{station.address}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {station.distance.toFixed(1)} km away
                          </span>
                          {station.phone && <span>📞 {station.phone}</span>}
                          {station.hours && <span>🕐 {station.hours}</span>}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${availabilityClass(
                          station.availability,
                        )}`}
                      >
                        {station.availability}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedStation && (
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${selectedStation.latitude},${selectedStation.longitude}`,
                    "_blank",
                  )
                }
              >
                Get directions to {selectedStation.name}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!userLocation && !error && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Tap "Use my current location" above to see nearby testing stations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
