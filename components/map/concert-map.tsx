"use client";

import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TourStop } from "@/lib/types";
import { ConcertPreviewSheet } from "./concert-preview-sheet";

interface ConcertMapProps {
  stops: TourStop[];
  selectedStopId?: string;
  onPlanTrip: (stop: TourStop) => void;
  className?: string;
}

export function ConcertMap({
  stops,
  selectedStopId,
  onPlanTrip,
  className = "",
}: ConcertMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const markersRef = React.useRef<L.Marker[]>([]);
  const [activeStop, setActiveStop] = React.useState<TourStop | null>(null);

  // Initialize Map
  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    // Guard against multiple initializations
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.5, 78.9], // Center of India
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
      });

      // CartoDB Dark Matter Tiles (100% Free, zero API key)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Add Zoom control to bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when `stops` change
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Create custom pin icon
    const createCustomIcon = (cityName: string, price: number, isSelected: boolean) => {
      const formattedPrice = `₹${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
      return L.divIcon({
        className: "custom-marker-wrapper",
        html: `
          <div class="custom-marker-pin" style="
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background: ${isSelected ? "#6366f1" : "rgba(18, 18, 27, 0.95)"};
            border: 2px solid ${isSelected ? "#06b6d4" : "#4f46e5"};
            border-radius: 9999px;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6), 0 0 12px ${isSelected ? "rgba(6, 182, 212, 0.6)" : "rgba(99, 102, 241, 0.3)"};
            transform: translate(-50%, -50%);
            white-space: nowrap;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 9999px;
              background-color: ${isSelected ? "#06b6d4" : "#10b981"};
              display: inline-block;
            "></span>
            <span>${cityName}</span>
            <span style="color: ${isSelected ? "#ffffff" : "#a5b4fc"}; font-family: monospace;">${formattedPrice}</span>
          </div>
        `,
        iconSize: [100, 32],
        iconAnchor: [50, 16],
      });
    };

    stops.forEach((stop) => {
      const isSelected = stop.id === selectedStopId || stop.id === activeStop?.id;
      const icon = createCustomIcon(stop.cityName, stop.startingPriceINR, isSelected);

      const marker = L.marker([stop.coordinates.lat, stop.coordinates.lng], { icon })
        .addTo(map)
        .on("click", () => {
          setActiveStop(stop);
          map.flyTo([stop.coordinates.lat, stop.coordinates.lng], 9, {
            duration: 1.2,
          });
        });

      markersRef.current.push(marker);
    });

    // Auto-fit bounds if we have stops
    if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map((s) => [s.coordinates.lat, s.coordinates.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
    }
  }, [stops, selectedStopId, activeStop?.id]);

  return (
    <div className={`relative w-full h-[580px] rounded-2xl overflow-hidden border border-border-subtle shadow-2xl bg-surface ${className}`}>
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Info Overlay */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <div className="rounded-xl bg-surface/90 px-3.5 py-2 backdrop-blur-md border border-border-subtle shadow-lg">
          <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            Interactive Concert Map
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Click any venue pin to preview and calculate trip expenses
          </p>
        </div>
      </div>

      {/* Marker Preview Bottom Sheet */}
      <ConcertPreviewSheet
        stop={activeStop}
        onClose={() => setActiveStop(null)}
        onPlanTrip={(stop) => {
          onPlanTrip(stop);
          setActiveStop(null);
        }}
      />
    </div>
  );
}
