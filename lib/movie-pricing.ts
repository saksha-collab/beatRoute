import { BankCardOffer, CatalogItem, MovieCheckoutOption } from './types';
import { INDIAN_BANK_CARD_OFFERS } from './data/bank-offers';

export interface MovieCalculatorInput {
  item: CatalogItem;
  baseTicketPriceINR: number;
  ticketCount: number;
  selectedCardIds: string[];
}

/**
 * Computes the exact net checkout total across BookMyShow, District by Zomato,
 * and Direct Multiplex Box Office / App (PVR INOX / Cinépolis):
 *
 * Net Payable = (Base Ticket × Qty) + (Platform Convenience Fee × Qty × 1.18 GST) − Card Offer Discount
 */
export function calculateMovieCheckoutOptions({
  item,
  baseTicketPriceINR,
  ticketCount,
  selectedCardIds,
}: MovieCalculatorInput): MovieCheckoutOption[] {
  const bmsListing = item.listings?.find((l) => l.source === 'bookmyshow');
  const districtListing = item.listings?.find((l) => l.source === 'district');

  const bmsUrl =
    bmsListing?.bookingUrl ||
    (item.source === 'bookmyshow'
      ? item.bookingUrl
      : `https://in.bookmyshow.com/explore/movies-pune`);

  const districtUrl =
    districtListing?.bookingUrl ||
    (item.source === 'district'
      ? item.bookingUrl
      : `https://www.district.in/movies/`);

  const pvrUrl = 'https://www.pvrcinemas.com/';

  const platforms: {
    id: 'bookmyshow' | 'district' | 'pvr_direct';
    name: string;
    url: string;
    baseFeePerTicketINR: number; // Pre-GST internet handling fee
  }[] = [
    {
      id: 'bookmyshow',
      name: 'BookMyShow',
      url: bmsUrl,
      baseFeePerTicketINR: 30, // ₹30 + 18% GST = ₹35.40/ticket
    },
    {
      id: 'district',
      name: 'District by Zomato',
      url: districtUrl,
      baseFeePerTicketINR: 25, // ₹25 + 18% GST = ₹29.50/ticket
    },
    {
      id: 'pvr_direct',
      name: 'Direct Cinema QR (PVR / Cinépolis)',
      url: pvrUrl,
      baseFeePerTicketINR: 0, // ₹0 internet handling fee at cinema QR / box office
    },
  ];

  const baseSubtotalINR = baseTicketPriceINR * ticketCount;

  const rawOptions = platforms.map((p) => {
    const preGstFeeTotal = p.baseFeePerTicketINR * ticketCount;
    const gstOnFeeINR = Math.round(preGstFeeTotal * 0.18);
    const totalConvenienceFeeINR = preGstFeeTotal + gstOnFeeINR;

    // Find matching bank card offers owned by the user for this platform
    const matchingOffers = INDIAN_BANK_CARD_OFFERS.filter(
      (offer) =>
        offer.platform === p.id &&
        selectedCardIds.includes(offer.id) &&
        ticketCount >= offer.minTickets
    );

    let bestOffer: BankCardOffer | undefined;
    let bestDiscountINR = 0;

    for (const offer of matchingOffers) {
      let discount = 0;
      if (offer.offerType === 'bogo') {
        const rawBogo = Math.round(
          baseTicketPriceINR * ((offer.discountPercent || 100) / 100)
        );
        discount = Math.min(rawBogo, offer.maxDiscountINR);
      } else if (offer.offerType === 'flat') {
        discount = Math.min(baseSubtotalINR, offer.maxDiscountINR);
      } else if (offer.offerType === 'percentage') {
        const rawPct = Math.round(
          baseSubtotalINR * ((offer.discountPercent || 10) / 100)
        );
        discount = Math.min(rawPct, offer.maxDiscountINR);
      }

      if (discount > bestDiscountINR) {
        bestDiscountINR = discount;
        bestOffer = offer;
      }
    }

    const netPayableINR = Math.max(
      0,
      baseSubtotalINR + totalConvenienceFeeINR - bestDiscountINR
    );

    return {
      platform: p.id,
      platformName: p.name,
      bookingUrl: p.url,
      ticketCount,
      baseTicketPriceINR,
      baseSubtotalINR,
      convenienceFeePerTicketINR: p.baseFeePerTicketINR,
      gstOnFeeINR,
      totalConvenienceFeeINR,
      appliedCardOffer: bestOffer,
      cardDiscountINR: bestDiscountINR,
      netPayableINR,
      savingsVsHighestINR: 0,
      isCheapest: false,
    };
  });

  const highestNet = Math.max(...rawOptions.map((o) => o.netPayableINR));
  const lowestNet = Math.min(...rawOptions.map((o) => o.netPayableINR));

  return rawOptions
    .map((opt) => ({
      ...opt,
      savingsVsHighestINR: Math.max(0, highestNet - opt.netPayableINR),
      isCheapest: opt.netPayableINR === lowestNet,
    }))
    .sort((a, b) => a.netPayableINR - b.netPayableINR);
}
