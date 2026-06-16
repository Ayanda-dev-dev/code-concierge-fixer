import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";

export type TestingStation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in km
  availability: "available" | "limited" | "unavailable";
  phone?: string;
  hours?: string;
};

export type GoogleMapsLocationProps = {
  onLocationCapture?: (data: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  appId?: string;
};

// Durban testing stations (sample data - should be fetched from backend)
const DURBAN_TESTING_STATIONS: Omit<TestingStation, "distance">[] = [
  {
    id: "station_001",
    name: "Durban City Testing Centre",
    address: "87 Field Street, Durban Central, 4001",
    latitude: -29.8587,
    longitude: 31.0192,
    availability: "available",
    phone: "031 306 8600",
    hours: "Mon-Fri: 8:00 AM - 4:00 PM",
  },
  {
    id: "station_002",
    name: "Pinetown Regional Testing Station",
    address: "123 Main Road, Pinetown, 3610",
    latitude: -29.8074,
    longitude: 30.8686,
    availability: "available",
    phone: "031 701 2000",
    hours: "Mon-Fri: 8:00 AM - 4:00 PM",
  },
  {
    id: "station_003",
    name: "Westville Testing Facility",
    address: "45 Argyle Road, Westville, 3630",
    latitude: -29.8485,
    longitude: 30.8274,
    availability: "limited",
    phone: "031 268 9000",
    hours: "Mon-Thu: 8:00 AM - 4:00 PM, Fri: 8:00 AM - 1:00 PM",
  },
  {
    id: "station_004",
    name: "Umbogintwini Testing Office",
    address: "89 Old Main Road, Umbogintwini, 4170",
    latitude: -29.99,
    longitude: 30.8976,
    availability: "available",
    phone: "031 916 3000",
    hours: "Mon-Fri: 8:00 AM - 4:00 PM",
  },
  {
    id: "station_005",
    name: "Durban North Testing Centre",
    address: "234 Ridge Road, Durban North, 4051",
    latitude: -29.7876,
    longitude: 31.0246,
    availability: "available",
    phone: "031 563 8000",
    hours: "Mon-Fri: 8:00 AM - 4:00 PM",
  },
];

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getAvailabilityColor(availability: string): string {
  switch (availability) {
    case "available":
      return "bg-green-100 text-green-800 border-green-300";
    case "limited":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "unavailable":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export function GoogleMapsLocation({
  onLocationCapture,
  appId,
}: GoogleMapsLocationProps) {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [stations, setStations] = useState<TestingStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<TestingStation | null>(
    null
  );
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Get user's current location
  const handleGetLocation = async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
          const address = result.results[0]?.formatted_address || "Current Location";

          const userLoc = { latitude, longitude, address };
          setUserLocation(userLoc);

          if (onLocationCapture) {
            onLocationCapture(userLoc);
          }

          // Calculate distances to stations
          const stationsWithDistance = DURBAN_TESTING_STATIONS.map((station) => ({
            ...station,
            distance: calculateDistance(
              latitude,
              longitude,
              station.latitude,
              station.longitude
            ),
          })).sort((a, b) => a.distance - b.distance);

          setStations(stationsWithDistance);
          toast.success("Your location found! Nearby stations loaded.");

          // Initialize map
          initializeMap(latitude, longitude, stationsWithDistance);
        } catch (err) {
          console.error("Geocoding error:", err);
          // Continue even if geocoding fails
          const stationsWithDistance = DURBAN_TESTING_STATIONS.map((station) => ({
            ...station,
            distance: calculateDistance(
              latitude,
              longitude,
              station.latitude,
              station.longitude
            ),
          })).sort((a, b) => a.distance - b.distance);

          setStations(stationsWithDistance);
          setUserLocation({ latitude, longitude, address: "Current Location" });
          initializeMap(latitude, longitude, stationsWithDistance);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        let errorMsg = "Could not get your location";
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please enable it in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable.";
        } else if (err.code === err.TIMEOUT) {
          errorMsg = "Request to get user location timed out.";
        }
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
      }
    );
  };

  const initializeMap = (
    centerLat: number,
    centerLng: number,
    stationsData: TestingStation[]
  ) => {
    if (!mapContainerRef.current) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      zoom: 11,
      center: { lat: centerLat, lng: centerLng },
      mapTypeControl: true,
      fullscreenControl: true,
      styles: [
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#616161" }],
        },
      ],
    });

    mapRef.current = map;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add user location marker
    const userMarker = new google.maps.Marker({
      position: { lat: centerLat, lng: centerLng },
      map,
      title: "Your Location",
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    });
    markersRef.current.push(userMarker);

    // Add testing station markers
    stationsData.forEach((station, index) => {
      const markerColor = {
        available: "red",
        limited: "yellow",
        unavailable: "gray",
      }[station.availability] || "red";

      const marker = new google.maps.Marker({
        position: { lat: station.latitude, lng: station.longitude },
        map,
        title: station.name,
        label: String(index + 1),
        icon: `http://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
      });

      marker.addListener("click", () => {
        setSelectedStation(station);
        map.panTo({ lat: station.latitude, lng: station.longitude });
      });

      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      setError(
        "Google Maps API not loaded. Please ensure Google Maps API key is configured."
      );
    }
  }, []);

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Find Testing Stations in Durban
          </CardTitle>
          <CardDescription>
            Locate your nearest driving licence testing centre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Location Error</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleGetLocation}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-4 w-4" />
                Get My Location
              </>
            )}
          </Button>

          {userLocation && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-900">✓ Location Found</p>
              <p className="text-xs text-blue-900 mt-1">{userLocation.address}</p>
              <p className="text-xs text-blue-900">
                Coordinates: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Container */}
      {userLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Map View</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={mapContainerRef}
              className="h-96 w-full rounded-lg border border-gray-200"
            />
          </CardContent>
        </Card>
      )}

      {/* Stations List */}
      {stations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Nearby Testing Stations ({stations.length})
            </CardTitle>
            <CardDescription>
              Listed by distance from your location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stations.map((station, index) => (
                <div
                  key={station.id}
                  className={`cursor-pointer rounded-lg border p-4 transition hover:shadow-md ${
                    selectedStation?.id === station.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => setSelectedStation(station)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold text-sm">{station.name}</h3>
                      </div>
                      <p className="text-xs text-gray-600">{station.address}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="font-medium">
                          {station.distance.toFixed(1)} km away
                        </span>
                        {station.phone && <span>📞 {station.phone}</span>}
                      </div>
                      {station.hours && (
                        <p className="text-xs text-gray-600">🕐 {station.hours}</p>
                      )}
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium border ${getAvailabilityColor(
                        station.availability
                      )}`}
                    >
                      {station.availability.charAt(0).toUpperCase() +
                        station.availability.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Station Details */}
      {selectedStation && (
        <Card className="border-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">{selectedStation.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-600">Address</p>
              <p className="text-sm">{selectedStation.address}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Distance</p>
              <p className="text-sm">{selectedStation.distance.toFixed(1)} km from you</p>
            </div>
            {selectedStation.phone && (
              <div>
                <p className="text-xs font-medium text-gray-600">Contact</p>
                <p className="text-sm">{selectedStation.phone}</p>
              </div>
            )}
            {selectedStation.hours && (
              <div>
                <p className="text-xs font-medium text-gray-600">Hours</p>
                <p className="text-sm">{selectedStation.hours}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-600">Availability</p>
              <div
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium border ${getAvailabilityColor(
                  selectedStation.availability
                )}`}
              >
                {selectedStation.availability.charAt(0).toUpperCase() +
                  selectedStation.availability.slice(1)}
              </div>
            </div>
            <Button
              onClick={() => {
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedStation.latitude},${selectedStation.longitude}&destination_place_id=${selectedStation.id}`;
                window.open(mapsUrl, "_blank");
              }}
              className="w-full"
              variant="default"
            >
              Get Directions
            </Button>
          </CardContent>
        </Card>
      )}

      {!userLocation && !error && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-gray-600">
              Click "Get My Location" above to find nearby testing stations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
