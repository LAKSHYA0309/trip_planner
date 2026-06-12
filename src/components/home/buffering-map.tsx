"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Compass } from "lucide-react";

interface BufferingMapProps {
  startLocation: string;
  destination: string;
}

export function BufferingMap({ startLocation, destination }: BufferingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let mapInstance: any = null;

    const geocode = async (query: string) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
          {
            headers: {
              "User-Agent": "BharatYatraTravelPlanner/1.0",
            },
          }
        );
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
          };
        }
      } catch (err) {
        console.error("Geocoding failed for: " + query, err);
      }
      return null;
    };

    const initMap = async () => {
      const startCoords = await geocode(startLocation);
      const destCoords = await geocode(destination);

      if (!isMounted) return;

      // Dynamic import to prevent SSR errors
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapContainerRef.current) return;
      setLoading(false);

      // Initialize Map with dark themed tiles
      mapInstance = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(mapInstance);

      const points: [number, number][] = [];

      // Custom DivIcons for Start and Destination
      const startIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-gold text-black border border-white font-bold text-xs shadow-lg shadow-gold/50">S</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const destIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white border border-white font-bold text-xs shadow-lg shadow-red-500/50 animate-pulse">D</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (startCoords) {
        L.marker([startCoords.lat, startCoords.lon], { icon: startIcon }).addTo(mapInstance);
        points.push([startCoords.lat, startCoords.lon]);
      }

      if (destCoords) {
        L.marker([destCoords.lat, destCoords.lon], { icon: destIcon }).addTo(mapInstance);
        points.push([destCoords.lat, destCoords.lon]);
      }

      if (points.length === 2) {
        const polyline = L.polyline(points, {
          color: "#D4AF37", // Gold line
          weight: 3,
          dashArray: "8, 8",
          className: "animate-dash", // Custom dash animation class
        }).addTo(mapInstance);

        mapInstance.fitBounds(polyline.getBounds(), {
          padding: [40, 40],
          maxZoom: 12,
        });
      } else if (points.length === 1) {
        mapInstance.setView(points[0], 8);
      } else {
        // Center of India fallback
        mapInstance.setView([20.5937, 78.9629], 5);
      }

      mapRef.current = mapInstance;

      // Force size update
      setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
      }, 100);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [startLocation, destination]);

  return (
    <div className="relative w-full h-[320px] md:h-[400px] rounded-2xl overflow-hidden border border-gold/20 shadow-2xl bg-black/40">
      <div ref={mapContainerRef} className="w-full h-full opacity-60 filter grayscale contrast-125 brightness-75" />
      
      {/* Loading overlay panel */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/75 backdrop-blur-[1px] p-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl animate-pulse" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full border border-gold/30 bg-charcoal/80 text-gold shadow-lg shadow-gold/20">
            <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>
        
        <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-2">
          Charting Your Route
        </h4>
        <p className="text-xs text-gold font-mono mb-4 bg-gold/5 border border-gold/10 px-3 py-1 rounded-full animate-pulse">
          {startLocation} &rarr; {destination}
        </p>
        
        <div className="max-w-md space-y-2.5">
          <div className="flex items-center justify-center gap-2 text-sm text-white/90 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
            <span>AI is crafting your premium travel guide...</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed italic">
            "Retrieving real-time transit schedules, mapping hotel vouchers, and analyzing local sightseeing points."
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .animate-dash {
          animation: dash 3s linear infinite;
        }
      `}} />
    </div>
  );
}
