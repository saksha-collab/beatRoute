"use client";

import * as React from "react";
import { ConcertEvent } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConcertInlineMapWrapper } from "./concert-inline-map-wrapper";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Radio,
  Users,
  Music2,
  Sparkles,
} from "lucide-react";

interface ConcertFeedCardProps {
  concert: ConcertEvent;
  className?: string;
}

export function ConcertFeedCard({ concert, className = "" }: ConcertFeedCardProps) {
  const [showMap, setShowMap] = React.useState(false);
  const [showTiers, setShowTiers] = React.useState(false);

  // Format Date & Calculate Humanized Countdown
  const dateObj = new Date(concert.date);
  const formattedDate = dateObj.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const getCountdownLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Tonight";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays > 7 && diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    if (diffDays > 30) return `In ${Math.round(diffDays / 30)} months`;
    return "Confirmed Stop";
  };

  const countdownText = getCountdownLabel(concert.date);

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:border-border-strong hover:shadow-cardHover bg-surface-elevated/70 backdrop-blur-md ${className}`}
    >
      {/* Top Banner Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header: Artist Info & Countdown Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Artist Thumbnail */}
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-surface-elevated border border-border-strong shrink-0 shadow-md">
              <img
                src={concert.artistImageUrl}
                alt={concert.artist}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
                  {concert.artist}
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-semibold text-cyan-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  {countdownText}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                {concert.tourName}
              </p>

              {/* Genre Pills */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {concert.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="text-[10px] font-medium text-text-muted px-2 py-0.5 rounded-md bg-surface-elevated border border-border-subtle"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Price & Ticket Status */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border-subtle">
            <span className="text-[11px] text-text-muted font-medium">Starting from</span>
            <div className="text-xl sm:text-2xl font-black text-text-primary font-mono tracking-tight text-gradient-cyan">
              {formatCurrency(concert.startingPriceINR)}
            </div>

            <div className="mt-1">
              {concert.ticketStatus === "available" && (
                <Badge variant="savings" className="text-[10px] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Tickets Available
                </Badge>
              )}
              {concert.ticketStatus === "low_stock" && (
                <Badge variant="caution" className="text-[10px] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Fast Filling
                </Badge>
              )}
              {concert.ticketStatus === "sold_out" && (
                <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/30 bg-rose-500/10">
                  Sold Out
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Date, Time & Stadium Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-elevated/60 border border-border-subtle text-xs">
          {/* Date & Time */}
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-surface border border-border-strong flex items-center justify-center text-cyan-400 shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Concert Date</span>
              <span className="font-semibold text-text-primary">{formattedDate}</span>
              {concert.time && (
                <span className="text-text-secondary block text-[11px] mt-0.5">
                  Gate: {concert.time}
                </span>
              )}
            </div>
          </div>

          {/* Venue & City */}
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-surface border border-border-strong flex items-center justify-center text-indigo-400 shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Stadium & City</span>
              <span className="font-semibold text-text-primary block line-clamp-1">
                {concert.venue}
              </span>
              <span className="text-cyan-400 font-semibold text-[11px] block mt-0.5">
                {concert.cityName}, India
              </span>
            </div>
          </div>

          {/* Capacity & Highlights */}
          <div className="flex items-start gap-2.5 sm:col-span-2 lg:col-span-1">
            <div className="h-8 w-8 rounded-lg bg-surface border border-border-strong flex items-center justify-center text-purple-400 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Venue Scale</span>
              <span className="font-semibold text-text-primary">
                {concert.venueCapacity ? `${concert.venueCapacity} Capacity` : "Major Arena Format"}
              </span>
              {concert.highlights && concert.highlights[0] && (
                <span className="text-text-muted block text-[11px] line-clamp-1 mt-0.5">
                  ★ {concert.highlights[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Ticket Tiers breakdown */}
        {concert.ticketTiers && concert.ticketTiers.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowTiers(!showTiers)}
              className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-cyan-300 transition-colors"
            >
              <Ticket className="h-3.5 w-3.5 text-cyan-400" />
              <span>View {concert.ticketTiers.length} Verified Price Tiers</span>
              {showTiers ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showTiers && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 animate-fadeIn">
                {concert.ticketTiers.map((tier) => (
                  <div
                    key={tier.tierId}
                    className="p-2.5 rounded-lg bg-surface border border-border-subtle flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-text-primary text-xs block">
                        {tier.name}
                      </span>
                      <span className="text-[10px] text-text-muted capitalize">
                        {tier.availability.replace("_", " ")}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-cyan-400">
                      {formatCurrency(tier.priceINR)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls & Official Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border-subtle">
          {/* Social Channels */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {concert.socials?.spotify && (
              <a
                href={concert.socials.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-emerald-400 transition-colors"
                title="Listen on Spotify"
              >
                <Music2 className="h-3.5 w-3.5" />
                <span>Spotify</span>
              </a>
            )}

            {concert.socials?.instagram && (
              <a
                href={concert.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-pink-400 transition-colors"
                title="Official Instagram Profile"
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Instagram</span>
              </a>
            )}

            {concert.socials?.website && (
              <a
                href={concert.socials.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-cyan-400 transition-colors"
                title="Official Website"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Tour Web</span>
              </a>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Toggle Inline Map */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>{showMap ? "Hide Stadium Map" : "View Stadium Map"}</span>
            </Button>

            {/* Official Box Office CTA */}
            <a
              href={concert.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none"
            >
              <Button
                variant="neon"
                size="sm"
                className="w-full flex items-center justify-center gap-1.5 font-bold"
              >
                <span>Book Tickets</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>

        {/* Expandable Inline Stadium Mini-Map */}
        {showMap && (
          <div className="animate-fadeIn">
            <ConcertInlineMapWrapper
              venue={concert.venue}
              cityName={concert.cityName}
              coordinates={concert.coordinates}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
