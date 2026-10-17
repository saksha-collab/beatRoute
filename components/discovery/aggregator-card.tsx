"use client";

import * as React from "react";
import Image from "next/image";
import { MapPin, Calendar, Clock, Ticket, ArrowRight, Sparkles } from "lucide-react";
import { CatalogItem } from "@/lib/types";

interface AggregatorCardProps {
  item: CatalogItem;
  isSelected?: boolean;
  onSelect: (item: CatalogItem) => void;
  travelSavingsINR?: number;
}

export function AggregatorCard({
  item,
  isSelected = false,
  onSelect,
  travelSavingsINR,
}: AggregatorCardProps) {
  const isBMS = item.source === "bookmyshow";
  const isDistrict = item.source === "district";

  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Multiple Dates";

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row gap-4 ${
        isSelected
          ? "bg-surface border-accent-dune ring-1 ring-accent-dune shadow-md"
          : "bg-surface border-border-subtle hover:border-border-strong hover:bg-surface-elevated/40"
      }`}
    >
      {/* Poster Image */}
      <div className="relative w-full sm:w-24 h-32 sm:h-auto rounded-xl bg-surface-elevated shrink-0 overflow-hidden border border-border-subtle">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-elevated text-text-muted">
            <Ticket className="h-6 w-6" />
          </div>
        )}

        {/* City Code Pill */}
        {item.cityCode && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75 text-white shadow-sm">
            {item.cityCode}
          </span>
        )}
      </div>

      {/* Details & Specs */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Metadata badges row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-elevated text-text-muted">
              {item.category || item.type.toUpperCase()}
            </span>

            {/* Platform source badge */}
            {isBMS && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20">
                BookMyShow
              </span>
            )}
            {isDistrict && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
                District by Zomato
              </span>
            )}
            {!isBMS && !isDistrict && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-dune/10 text-accent-dune border border-accent-dune/20">
                Curated
              </span>
            )}

            <span className="text-[11px] text-text-muted font-mono flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-text-primary tracking-tight truncate group-hover:text-accent-dune transition-colors">
            {item.title}
          </h3>

          {/* Venue & City */}
          <p className="text-xs text-text-muted truncate mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-text-muted" />
            <span>{item.venue ? `${item.venue}, ${item.cityName}` : item.cityName}</span>
          </p>
        </div>

        {/* Bottom row: Arbitrage hook or language/time */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border-subtle/60">
          <div>
            {travelSavingsINR && travelSavingsINR > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#E8EFE8] text-[#2E7D32] border border-[#CDE0CF]">
                <Sparkles className="h-3 w-3" />
                <span>Save up to ₹{travelSavingsINR.toLocaleString()} via Arbitrage</span>
              </span>
            ) : item.time ? (
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{item.time}</span>
              </span>
            ) : (
              <span className="text-[11px] text-text-muted">Instant Booking Available</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Price & CTA Block */}
      <div className="flex sm:flex-col justify-between sm:items-end sm:justify-center border-t sm:border-t-0 sm:border-l border-border-subtle pt-3 sm:pt-0 sm:pl-4 shrink-0">
        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-bold text-text-muted block">
            Starting from
          </span>
          <span className="text-lg font-black text-text-primary font-mono">
            {item.startingPriceINR ? `₹${item.startingPriceINR.toLocaleString()}` : "Free"}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
          }}
          className={`mt-2 flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isSelected
              ? "bg-accent-dune text-white shadow-sm"
              : "bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border-subtle"
          }`}
        >
          <span>{isSelected ? "Active" : "Compare"}</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
