import { getRailQuote } from "./data/rail-fares";
import { CITY_MAP, CITIES, FLIGHT_QUOTES, LODGING_RATES } from "./mock-data";
import {
  ArbitrageResult,
  CityCode,
  RailClass,
  StayPreference,
  TicketTier,
  TourStop,
  TransitMode,
  TripItineraryBreakdown,
} from "./types";

interface CalculateArbitrageParams {
  originCityCode: CityCode;
  tourStops: TourStop[];
  selectedTierId: string;
  transitMode: TransitMode;
  railClass?: RailClass;
  stayPreference?: StayPreference;
  hourlyValueINR?: number;
}

/**
 * Pure calculation engine for concert travel arbitrage.
 * Computes comparative total trip expenses, net savings against home city concerts,
 * and time-to-savings trade-off ranks.
 */
export function calculateArbitrageMatrix({
  originCityCode,
  tourStops,
  selectedTierId,
  transitMode,
  railClass = "3AC",
  stayPreference = "comfort",
  hourlyValueINR = 350,
}: CalculateArbitrageParams): ArbitrageResult[] {
  const originCity = CITY_MAP[originCityCode];
  if (!originCity) return [];

  // 1. Check if the tour has a stop in the user's home origin city
  const homeStop = tourStops.find((s) => s.cityCode === originCityCode);
  let homeCityTotalCostINR: number | null = null;

  if (homeStop) {
    const homeTier =
      homeStop.ticketTiers.find((t) => t.tierId === selectedTierId) ||
      homeStop.ticketTiers[0] || { priceINR: homeStop.startingPriceINR };
    // Attending in home city requires: Ticket + Local Cab. No flight/train and no hotel needed!
    homeCityTotalCostINR = homeTier.priceINR + originCity.cabBaseRateINR;
  }

  // 2. Calculate expenses for all tour stops
  const rawResults: ArbitrageResult[] = tourStops.map((stop) => {
    const destinationCity = CITY_MAP[stop.cityCode] || {
      code: stop.cityCode,
      name: stop.cityName,
      state: "India",
      airportCode: stop.cityCode,
      primaryStationCode: stop.cityCode,
      stationName: `${stop.cityName} Junction`,
      coordinates: stop.coordinates,
      cabBaseRateINR: 1200,
    };

    // Find selected ticket tier
    const selectedTier: TicketTier =
      stop.ticketTiers.find((t) => t.tierId === selectedTierId) ||
      stop.ticketTiers[0] || {
        tierId: "default",
        name: "General Admission",
        priceINR: stop.startingPriceINR,
        availability: "available",
      };

    const isHomeCity = stop.cityCode === originCityCode;
    let transitCostINR = 0;
    let transitDurationMinutes = 0;
    let carrierOrTrainName = "Local Commute";
    let isEstimatedBaseline = false;

    let lodgingCostINR = 0;
    let localCabCostINR = destinationCity.cabBaseRateINR;

    if (isHomeCity) {
      // Attending at home: no long-distance transit or lodging
      transitCostINR = 0;
      lodgingCostINR = 0;
      localCabCostINR = originCity.cabBaseRateINR;
      transitDurationMinutes = 45; // local cab to venue
      carrierOrTrainName = "City Cab / Metro";
    } else {
      // 1-night concert stay in destination city
      const cityLodging = LODGING_RATES[stop.cityCode]?.[stayPreference] || {
        cityCode: stop.cityCode,
        baseRatePerNightINR: 2500,
        hotelTier: stayPreference,
        surgeMultiplier: 1.3,
      };
      lodgingCostINR = Math.round(cityLodging.baseRatePerNightINR * cityLodging.surgeMultiplier);

      // Transit cost & timing
      if (transitMode === "flight") {
        const flightQuote =
          FLIGHT_QUOTES[`${originCityCode}-${stop.cityCode}`] ||
          FLIGHT_QUOTES[`${stop.cityCode}-${originCityCode}`];

        if (flightQuote) {
          transitCostINR = flightQuote.roundTripFareINR;
          transitDurationMinutes = flightQuote.durationMinutes;
          carrierOrTrainName = `${flightQuote.airline} (Round Trip)`;
        } else {
          // Standard Indian domestic flight fallback estimate
          transitCostINR = 7200;
          transitDurationMinutes = 120;
          carrierOrTrainName = "Direct Flight (Est.)";
          isEstimatedBaseline = true;
        }
      } else {
        // Rail Transit
        const railQuote = getRailQuote(originCityCode, stop.cityCode);
        if (railQuote && railQuote.classes[railClass]) {
          const fareData = railQuote.classes[railClass]!;
          transitCostINR = fareData.fareINR * 2; // Round trip
          transitDurationMinutes = fareData.durationMinutes;
          carrierOrTrainName = `${railQuote.trainName} (${railClass})`;
        } else if (railQuote) {
          // Fallback to another available class in this train
          const availableClass = (Object.keys(railQuote.classes)[0] as RailClass) || "3AC";
          const fareData = railQuote.classes[availableClass]!;
          transitCostINR = fareData.fareINR * 2;
          transitDurationMinutes = fareData.durationMinutes;
          carrierOrTrainName = `${railQuote.trainName} (${availableClass})`;
          isEstimatedBaseline = true;
        } else {
          // Standard telescopic rail estimate
          transitCostINR = railClass === "SL" ? 900 : railClass === "3AC" ? 2400 : 3600;
          transitDurationMinutes = 900;
          carrierOrTrainName = `Express Rail (${railClass})`;
          isEstimatedBaseline = true;
        }
      }
    }

    const totalTripCostINR =
      selectedTier.priceINR + transitCostINR + lodgingCostINR + localCabCostINR;

    const netSavingsINR =
      homeCityTotalCostINR !== null ? homeCityTotalCostINR - totalTripCostINR : null;

    return {
      destinationCity,
      tourStop: stop,
      selectedTier,
      transitMode,
      selectedRailClass: transitMode === "rail" ? railClass : undefined,
      ticketCostINR: selectedTier.priceINR,
      transitCostINR,
      lodgingCostINR,
      localCabCostINR,
      totalTripCostINR,
      transitDurationMinutes,
      transitDetails: {
        mode: transitMode,
        carrierOrTrainName,
        isEstimatedBaseline,
      },
      isHomeCity,
      homeCityTotalCostINR,
      netSavingsINR,
      arbitrageRank: 0,
      isSweetSpot: false,
      badges: [],
    };
  });

  // 3. Sorting & Badging Logic
  // If home city show exists, rank by highest net savings. If not, rank by lowest absolute trip cost.
  rawResults.sort((a, b) => {
    if (a.isHomeCity) return -1;
    if (b.isHomeCity) return 1;
    if (a.netSavingsINR !== null && b.netSavingsINR !== null) {
      return b.netSavingsINR - a.netSavingsINR;
    }
    return a.totalTripCostINR - b.totalTripCostINR;
  });

  // Assign ranks & badges
  let maxSavings = -Infinity;
  let minCost = Infinity;
  let highestScore = -Infinity;
  let sweetSpotIndex = -1;

  rawResults.forEach((res, index) => {
    res.arbitrageRank = index + 1;
    if (!res.isHomeCity) {
      if (res.netSavingsINR !== null && res.netSavingsINR > maxSavings) {
        maxSavings = res.netSavingsINR;
      }
      if (res.totalTripCostINR < minCost) {
        minCost = res.totalTripCostINR;
      }

      // Sweet Spot Metric: Financial savings vs travel duration penalty
      const travelHours = res.transitDurationMinutes / 60;
      const score = (res.netSavingsINR ?? 0) - travelHours * hourlyValueINR;
      if (score > highestScore) {
        highestScore = score;
        sweetSpotIndex = index;
      }
    }
  });

  return rawResults.map((res, index) => {
    const badges: string[] = [];

    if (res.isHomeCity) {
      badges.push("Home Show");
    } else {
      if (res.netSavingsINR !== null && res.netSavingsINR === maxSavings && maxSavings > 0) {
        badges.push("Top Arbitrage");
      }
      if (res.totalTripCostINR === minCost) {
        badges.push("Cheapest Total");
      }
      if (index === sweetSpotIndex && res.netSavingsINR !== null && res.netSavingsINR > 0) {
        res.isSweetSpot = true;
        badges.push("Sweet Spot Pick");
      }
      if (res.transitDurationMinutes <= 150 && !res.isHomeCity) {
        badges.push("Fastest Route");
      }
    }

    return { ...res, badges };
  });
}

/**
 * Calculates single trip itemized breakdown for the Expense Planner Drawer.
 */
export function calculateSingleItinerary(
  originCityCode: CityCode,
  destinationStop: TourStop,
  selectedTierId: string,
  transitMode: TransitMode,
  railClass: RailClass = "3AC",
  stayPreference: StayPreference = "comfort"
): TripItineraryBreakdown {
  const originCity = CITY_MAP[originCityCode] || CITIES[0];
  const isSameCity = originCityCode === destinationStop.cityCode;

  const selectedTier =
    destinationStop.ticketTiers.find((t) => t.tierId === selectedTierId) ||
    destinationStop.ticketTiers[0] || {
      tierId: "default",
      name: "General Admission",
      priceINR: destinationStop.startingPriceINR,
      availability: "available",
    };

  let transitINR = 0;
  let lodgingINR = 0;
  let cabINR = isSameCity ? originCity.cabBaseRateINR : (CITY_MAP[destinationStop.cityCode]?.cabBaseRateINR || 1200);
  let transitDurationMinutes = 45;
  let isEstimatedBaseline = false;

  if (!isSameCity) {
    // 1-night stay
    const lodging = LODGING_RATES[destinationStop.cityCode]?.[stayPreference] || {
      baseRatePerNightINR: 2800,
      surgeMultiplier: 1.35,
    };
    lodgingINR = Math.round(lodging.baseRatePerNightINR * lodging.surgeMultiplier);

    if (transitMode === "flight") {
      const flight =
        FLIGHT_QUOTES[`${originCityCode}-${destinationStop.cityCode}`] ||
        FLIGHT_QUOTES[`${destinationStop.cityCode}-${originCityCode}`];
      if (flight) {
        transitINR = flight.roundTripFareINR;
        transitDurationMinutes = flight.durationMinutes;
      } else {
        transitINR = 7200;
        transitDurationMinutes = 120;
        isEstimatedBaseline = true;
      }
    } else {
      const rail = getRailQuote(originCityCode, destinationStop.cityCode);
      if (rail && rail.classes[railClass]) {
        transitINR = rail.classes[railClass]!.fareINR * 2;
        transitDurationMinutes = rail.classes[railClass]!.durationMinutes;
      } else {
        transitINR = railClass === "SL" ? 900 : railClass === "3AC" ? 2400 : 3600;
        transitDurationMinutes = 900;
        isEstimatedBaseline = true;
      }
    }
  }

  const totalINR = selectedTier.priceINR + transitINR + lodgingINR + cabINR;

  return {
    originCity,
    destinationStop,
    selectedTier,
    transitMode,
    railClass: transitMode === "rail" ? railClass : undefined,
    stayPreference,
    ticketINR: selectedTier.priceINR,
    transitINR,
    lodgingINR,
    cabINR,
    totalINR,
    transitDurationMinutes,
    isEstimatedBaseline,
  };
}
