"use client";

import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoCoordinates } from "@/lib/types";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConcertInlineMapProps {
  venue: string;
  cityName: string;
  coordinates: GeoCoordinates;
}

export default function ConcertInlineMap({
  venue,
  cityName,
  coordinates,
}: ConcertInlineMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coordinates.lat, coordinates.lng],
        zoom: 14,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: true,
        scrollWheelZoom: false, // Prevent page scroll interception
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Neon Venue Pin
      const icon = L.divIcon({
        className: "custom-venue-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-cyan-400 opacity-60"></span>
            <span class="relative inline-flex h-4 w-4 rounded-full bg-cyan-400 border-2 border-white shadow-glowCyan"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([coordinates.lat, coordinates.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #1e293b; font-weight: 600;">
          <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${venue}</div>
          <div style="color: #64748b;">${cityName}, India</div>
        </div>
      `);

      mapInstanceRef.current = map;

      // Invalidate size once rendered in DOM
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, venue, cityName]);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${coordinates.lat}, ${coordinates.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;

  return (
    <div className="mt-4 rounded-xl border border-border-strong bg-surface-elevated overflow-hidden shadow-2xl transition-all">
      {/* Map Bar Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-text-primary">Stadium Map: {venue}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCoords}
            className="flex items-center gap-1 px-2 py-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors text-[11px]"
            title="Copy GPS coordinates"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
              </>
            )}
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold transition-colors text-[11px]"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-56 sm:h-64 bg-surface"
        style={{ zIndex: 10 }}
      />
    </div>
  );
}
