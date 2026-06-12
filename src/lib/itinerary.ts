import { fetchTrainsFromRapidApi, fetchBusesFromRapidApi, TransportOption } from "./rapidapi";
import { getFallbackTransportOptions } from "./rapidapi-fallback";

interface TripInput {
  startLocation: string;
  destination: string;
  budget: number;
  days: number;
  travelers: number;
  travelStyle: string;
}

export async function buildItinerary(input: TripInput) {
  const perDay = Math.floor(input.budget / input.days);
  const hotel = Math.floor(perDay * 0.47);
  const food = Math.floor(perDay * 0.24);
  const transport = Math.floor(perDay * 0.18);
  const attractions = perDay - hotel - food - transport;

  let transportOptions: {
    trains: TransportOption[];
    returnTrains: TransportOption[];
    buses: TransportOption[];
  };

  try {
    const trainRes = await fetchTrainsFromRapidApi(
      input.startLocation,
      input.destination,
      input.budget,
      input.days
    );
    const busRes = await fetchBusesFromRapidApi(
      input.startLocation,
      input.destination,
      input.budget,
      input.days
    );

    if (trainRes && busRes) {
      transportOptions = {
        trains: trainRes.trains,
        returnTrains: trainRes.returnTrains,
        buses: busRes,
      };
    } else {
      transportOptions = getFallbackTransportOptions(
        input.startLocation,
        input.destination,
        input.budget,
        input.days
      );
    }
  } catch (error) {
    console.error("[buildItinerary] Error fetching RapidAPI transport options, falling back:", error);
    transportOptions = getFallbackTransportOptions(
      input.startLocation,
      input.destination,
      input.budget,
      input.days
    );
  }

  const days = Array.from({ length: input.days }, (_, i) => ({
    day: i + 1,
    title:
      i === 0
        ? `Day ${i + 1}: ${input.startLocation} to ${input.destination}`
        : `Day ${i + 1} in ${input.destination}`,
    activities: [
      i === 0
        ? `Travel from ${input.startLocation} and settle into ${input.destination}`
        : `Explore local heritage sites and cultural landmarks`,
      `Discover authentic ${input.travelStyle.toLowerCase()} dining spots`,
      `Visit top-rated attractions curated for your budget`,
    ],
    bestPlace:
      i === 0
        ? `Main sights and markets near the city center of ${input.destination}`
        : `Heritage monuments, historic fortresses, and viewpoints in ${input.destination}`,
    bestFood:
      i === 0
        ? `Authentic regional welcome meal and traditional street snacks`
        : `Highly recommended regional specialties and local dessert delicacies`,
    estimatedCost: perDay,
  }));

  return {
    startLocation: input.startLocation,
    summary: `${input.days}-day ${input.travelStyle} trip from ${input.startLocation} to ${input.destination} for ${input.travelers} traveler${input.travelers > 1 ? "s" : ""}`,
    totalBudget: input.budget,
    dailyBudget: perDay,
    transportOptions,
    budgetBreakdown: {
      hotel,
      food,
      transport,
      attractions,
    },
    days,
    generatedAt: new Date().toISOString(),
  };
}
