"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface LeafletMapProps {
  placeName: string;
  destination: string;
}

export function LeafletMap({ placeName, destination }: LeafletMapProps) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Geocode location using Nominatim API
  useEffect(() => {
    let active = true;
    const fetchCoords = async () => {
      setLoading(true);
      setError(null);
      
      const query = `${placeName}, ${destination}`;
      try {
        let response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
          {
            headers: {
              "User-Agent": "BharatYatraTravelPlanner/1.0"
            }
          }
        );
        let data = await response.json();
        
        // If specific place query returned no results, try just the destination city
        if ((!data || data.length === 0) && active) {
          response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
            {
              headers: {
                "User-Agent": "BharatYatraTravelPlanner/1.0"
              }
            }
          );
          data = await response.json();
        }

        if (active) {
          if (data && data.length > 0) {
            setCoords({
              lat: parseFloat(data[0].lat),
              lon: parseFloat(data[0].lon)
            });
          } else {
            setError("Location not found");
          }
        }
      } catch (err) {
        if (active) {
          setError("Failed to load map coordinates");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCoords();
    return () => {
      active = false;
    };
  }, [placeName, destination]);

  // Initialize Map
  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;

    let isMounted = true;
    let mapInstance: any = null;
    let timerId: any = null;

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css")
    ]).then(([L]) => {
      if (!isMounted) return;

      // Wrap in a short timeout to allow the modal popup animations to complete
      timerId = setTimeout(() => {
        if (!isMounted || !mapContainerRef.current) return;

        // Clean up previous map instance if it exists
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        // Configure default marker icons explicitly to bypass Next.js asset-bundling issues
        const DefaultIcon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = DefaultIcon;

        mapInstance = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: false // disables scroll zooming to prevent page scroll hijack
        }).setView([coords.lat, coords.lon], 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);

        L.marker([coords.lat, coords.lon])
          .addTo(mapInstance)
          .bindPopup(`<b>${placeName}</b><br>${destination}`)
          .openPopup();

        mapRef.current = mapInstance;

        // Force Leaflet to re-calculate container size inside the modal
        mapInstance.invalidateSize();
      }, 250);
    }).catch(err => {
      console.error("Leaflet loading error:", err);
    });

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [coords]);

  if (loading) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-lg bg-black/40 border border-white/5 text-xs text-muted-foreground mt-2">
        <Loader2 className="h-4 w-4 animate-spin text-gold mr-2" />
        Locating travel spot...
      </div>
    );
  }

  if (error || !coords) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-lg bg-black/40 border border-white/5 text-xs text-muted-foreground gap-1.5 p-4 text-center mt-2">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        <span>Map unavailable: {error || "unknown error"}</span>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef} 
      className="h-80 w-full rounded-lg border border-gold/20 overflow-hidden shadow-inner no-print mt-2.5 relative z-0"
    />
  );
}
