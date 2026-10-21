"use client";

import * as React from "react";
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Users,
  Film,
} from "lucide-react";
import { CatalogItem } from "@/lib/types";
import { INDIAN_BANK_CARD_OFFERS } from "@/lib/data/bank-offers";
import { calculateMovieCheckoutOptions } from "@/lib/movie-pricing";

interface MovieCheckoutCalculatorProps {
  item: CatalogItem;
}

const SEAT_SLABS = [
  { label: "Classic 2D", price: 180 },
  { label: "Prime 2D", price: 260 },
  { label: "Recliner / Club", price: 380 },
  { label: "IMAX / 4DX", price: 520 },
];

const WALLET_STORAGE_KEY = "beatroute_saved_cards";

export function MovieCheckoutCalculator({ item }: MovieCheckoutCalculatorProps) {
  const [basePriceINR, setBasePriceINR] = React.useState<number>(260);
  const [ticketCount, setTicketCount] = React.useState<number>(2);
  const [selectedCards, setSelectedCards] = React.useState<string[]>([
    "axis-myzone-district",
  ]);

  // Load user's saved bank cards from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(WALLET_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setSelectedCards(parsed);
        }
      } catch {}
    }
  }, []);

  const toggleCard = (cardId: string) => {
    setSelectedCards((prev) => {
      const next = prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId];
      if (typeof window !== "undefined") {
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const options = React.useMemo(
    () =>
      calculateMovieCheckoutOptions({
        item,
        baseTicketPriceINR: basePriceINR,
        ticketCount,
        selectedCardIds: selectedCards,
      }),
    [item, basePriceINR, ticketCount, selectedCards]
  );

  const cheapest = options[0];

  return (
    <div className="space-y-4">
      {/* 1. Seat Format & Ticket Quantity Controls */}
      <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-accent-dune" />
            <span>1. Select Seat Format (Base Price)</span>
          </span>
          <span className="font-mono text-xs font-bold text-text-primary">
            ₹{basePriceINR}/ticket
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {SEAT_SLABS.map((slab) => {
            const active = basePriceINR === slab.price;
            return (
              <button
                key={slab.label}
                onClick={() => setBasePriceINR(slab.price)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border text-center transition-all ${
                  active
                    ? "bg-text-primary text-surface border-text-primary shadow-xs"
                    : "bg-surface text-text-secondary border-border-subtle hover:border-border-strong"
                }`}
              >
                <span className="block truncate">{slab.label}</span>
                <span className="font-mono text-[10px] opacity-80">₹{slab.price}</span>
              </button>
            );
          })}
        </div>

        {/* Ticket Count Selector */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle/70">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-accent-dune" />
            <span>2. Tickets</span>
          </span>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((qty) => (
              <button
                key={qty}
                onClick={() => setTicketCount(qty)}
                className={`w-8 h-7 rounded-lg text-xs font-mono font-bold border transition-all ${
                  ticketCount === qty
                    ? "bg-accent-dune text-white border-accent-dune"
                    : "bg-surface text-text-secondary border-border-subtle hover:border-border-strong"
                }`}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. "My Cards" Offer Selector (Zero PCI Risk — Card Names Only) */}
      <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-border-subtle space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-accent-dune" />
            <span>3. Your Cards & BOGO Perks</span>
          </span>
          <span className="text-[10px] text-text-muted">
            {selectedCards.length} selected
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {INDIAN_BANK_CARD_OFFERS.map((offer) => {
            const isSelected = selectedCards.includes(offer.id);
            return (
              <button
                key={offer.id}
                onClick={() => toggleCard(offer.id)}
                title={offer.termsSummary}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                  isSelected
                    ? "bg-emerald-500/15 text-emerald-900 border-emerald-500/40"
                    : "bg-surface text-text-muted border-border-subtle hover:text-text-primary"
                }`}
              >
                {isSelected && <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />}
                <span>
                  {offer.bankName} {offer.cardName.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
        {ticketCount === 1 && selectedCards.length > 0 && (
          <p className="text-[10px] text-amber-700 bg-amber-500/10 px-2 py-1 rounded-md">
            Tip: Most bank BOGO offers require at least <strong>2 tickets</strong> to unlock the free ticket discount.
          </p>
        )}
      </div>

      {/* 3. Ranked Net Checkout Comparison across BMS, District & Multiplex Direct */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="font-bold text-text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent-dune" />
            <span>Net Checkout Comparison ({ticketCount} {ticketCount === 1 ? "Ticket" : "Tickets"})</span>
          </span>
          {cheapest && cheapest.savingsVsHighestINR > 0 && (
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Save up to ₹{cheapest.savingsVsHighestINR}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {options.map((opt) => (
            <div
              key={opt.platform}
              className={`p-3 rounded-xl border transition-all ${
                opt.isCheapest
                  ? "bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/20"
                  : "bg-surface border-border-subtle"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-text-primary">
                      {opt.platformName}
                    </span>
                    {opt.isCheapest && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wide bg-emerald-600 text-white">
                        Lowest Total
                      </span>
                    )}
                  </div>

                  {/* Fee & Offer Math Breakdown */}
                  <div className="text-[11px] text-text-muted mt-1 space-y-0.5 font-mono">
                    <div>
                      Base: ₹{opt.baseSubtotalINR} ({opt.ticketCount}×₹{opt.baseTicketPriceINR}) + Fee & GST: ₹{opt.totalConvenienceFeeINR}
                    </div>
                    {opt.appliedCardOffer && opt.cardDiscountINR > 0 && (
                      <div className="text-emerald-700 font-semibold">
                        − ₹{opt.cardDiscountINR} ({opt.appliedCardOffer.bankName} {opt.appliedCardOffer.cardName})
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-black font-mono text-text-primary block">
                    ₹{opt.netPayableINR.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    Net Payable
                  </span>
                </div>
              </div>

              {opt.bookingUrl && (
                <a
                  href={opt.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                    opt.isCheapest
                      ? "bg-text-primary text-surface hover:bg-text-secondary"
                      : "bg-surface-elevated text-text-primary hover:bg-border-subtle border border-border-subtle"
                  }`}
                >
                  <span>Book on {opt.platformName}</span>
                  <ExternalLink className="h-3 w-3 opacity-80" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
