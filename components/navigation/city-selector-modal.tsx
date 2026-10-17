"use client";

import * as React from "react";
import { X, MapPin, Navigation, Sparkles } from "lucide-react";
import { resolveCityCode, SUPPORTED_INDIAN_CITIES } from "@/lib/location";

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectCity: (cityCode: string) => void;
  isFirstVisit?: boolean;
}

const CITY_METROS = [
  { code: "BOM", name: "Mumbai", state: "Maharashtra", badge: "Hub" },
  { code: "DEL", name: "Delhi NCR", state: "National Capital", badge: "Hub" },
  { code: "BLR", name: "Bengaluru", state: "Karnataka", badge: "Tech & Live" },
  { code: "HYD", name: "Hyderabad", state: "Telangana", badge: "Arena" },
  { code: "CCU", name: "Kolkata", state: "West Bengal", badge: "Culture" },
  { code: "PNQ", name: "Pune", state: "Maharashtra", badge: "Music Hub" },
  { code: "AMD", name: "Ahmedabad", state: "Gujarat", badge: "Stadium" },
  { code: "ALL", name: "All India", state: "Pan-India Radar", badge: "National" },
];

export function CitySelectorModal({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
  isFirstVisit = false,
}: CitySelectorModalProps) {
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [detectError, setDetectError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (code: string) => {
    localStorage.setItem("beatroute_city", code);
    onSelectCity(code);
    onClose();
  };

  const handleDetectLocation = () => {
    setIsDetecting(true);
    setDetectError(null);

    if (!("geolocation" in navigator)) {
      setDetectError("Geolocation is not supported by your browser.");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Simple nearest city distance finder among supported cities
          let closestCity = SUPPORTED_INDIAN_CITIES[0];
          let minDistance = Infinity;

          for (const c of SUPPORTED_INDIAN_CITIES) {
            const d = Math.hypot(c.defaultLat - latitude, c.defaultLng - longitude);
            if (d < minDistance) {
              minDistance = d;
              closestCity = c;
            }
          }

          handleSelect(closestCity.code);
        } catch (e: any) {
          setDetectError("Could not determine city from coordinates.");
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setDetectError(err.message || "Location permission denied.");
        setIsDetecting(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border-strong shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-dune"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent-dune font-mono">
                {isFirstVisit ? "Welcome to BeatRoute" : "Select Location"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
              Which city are you exploring?
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              Discover concerts, cinema screenings, and live events curated across BookMyShow & District.
            </p>
          </div>

          {!isFirstVisit && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Detect Location Button */}
        <div>
          <button
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface-hover text-text-primary text-xs font-bold transition-all"
          >
            <Navigation className={`h-3.5 w-3.5 text-accent-dune ${isDetecting ? "animate-spin" : ""}`} />
            <span>{isDetecting ? "Detecting location..." : "Auto-detect my current city"}</span>
          </button>
          {detectError && (
            <p className="text-[11px] text-accent-danger mt-1.5 text-center">{detectError}</p>
          )}
        </div>

        {/* City Metro Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {CITY_METROS.map((city) => {
            const isSelected = selectedCity.toUpperCase() === city.code.toUpperCase();
            return (
              <button
                key={city.code}
                onClick={() => handleSelect(city.code)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-accent-dune bg-accent-dune/10 text-text-primary ring-1 ring-accent-dune"
                    : "border-border-subtle bg-surface hover:bg-surface-elevated hover:border-border-strong text-text-secondary"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-mono text-xs font-black text-text-primary">
                    {city.code}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md font-medium bg-surface-elevated text-text-muted">
                    {city.badge}
                  </span>
                </div>
                <span className="text-xs font-bold text-text-primary leading-tight">
                  {city.name}
                </span>
                <span className="text-[10px] text-text-muted truncate w-full mt-0.5">
                  {city.state}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
          <span>You can switch cities anytime from the header pill.</span>
          {isFirstVisit && (
            <button
              onClick={() => handleSelect("BOM")}
              className="text-accent-dune font-bold hover:underline"
            >
              Skip & Start with Mumbai
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
