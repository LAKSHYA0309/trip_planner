import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { buildItinerary } from "@/lib/itinerary";
import { travelStyles } from "@/lib/data";

async function validateLocationGeocoding(location: string): Promise<boolean> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "BharatYatraTravelPlanner/1.0",
      },
    });
    if (!res.ok) return true; // Graceful fallback: let it pass if geocoder is down
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error("Geocoding validation error:", error);
    return true; // Graceful fallback: let it pass if network request fails
  }
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to generate a trip." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { startLocation, destination, budget, days, travelers, travelStyle } =
      body as {
        startLocation?: string;
        destination?: string;
        budget?: number | string;
        days?: number | string;
        travelers?: number | string;
        travelStyle?: string;
      };

    if (!startLocation?.trim()) {
      return NextResponse.json(
        { error: "Starting location is required." },
        { status: 400 },
      );
    }

    if (!destination?.trim()) {
      return NextResponse.json(
        { error: "Destination is required." },
        { status: 400 },
      );
    }

    const trimmedStartLocation = startLocation.trim();
    const trimmedDestination = destination.trim();

    if (trimmedStartLocation.toLowerCase() === trimmedDestination.toLowerCase()) {
      return NextResponse.json(
        { error: "Starting location and destination must be different." },
        { status: 400 },
      );
    }

    // Geocoding Validation
    const isStartValid = await validateLocationGeocoding(trimmedStartLocation);
    if (!isStartValid) {
      return NextResponse.json(
        { error: `Starting location "${trimmedStartLocation}" could not be verified. Please check your spelling.` },
        { status: 400 }
      );
    }

    const isDestValid = await validateLocationGeocoding(trimmedDestination);
    if (!isDestValid) {
      return NextResponse.json(
        { error: `Destination "${trimmedDestination}" could not be verified. Please check your spelling.` },
        { status: 400 }
      );
    }

    const parsedBudget = Number(budget);
    const parsedDays = Number(days);
    const parsedTravelers = Number(travelers);

    if (!parsedBudget || parsedBudget < 1000) {
      return NextResponse.json(
        { error: "Please enter a valid budget (minimum ₹1,000)." },
        { status: 400 },
      );
    }

    if (!parsedDays || parsedDays < 1 || parsedDays > 30) {
      return NextResponse.json(
        { error: "Trip duration must be between 1 and 30 days." },
        { status: 400 },
      );
    }

    if (!parsedTravelers || parsedTravelers < 1 || parsedTravelers > 20) {
      return NextResponse.json(
        { error: "Number of travelers must be between 1 and 20." },
        { status: 400 },
      );
    }

    if (!travelStyle || !travelStyles.includes(travelStyle)) {
      return NextResponse.json(
        { error: "Please select a valid travel style." },
        { status: 400 },
      );
    }

    const itinerary = await buildItinerary({
      startLocation: trimmedStartLocation,
      destination: trimmedDestination,
      budget: parsedBudget,
      days: parsedDays,
      travelers: parsedTravelers,
      travelStyle,
    });

    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        destination: trimmedDestination,
        budget: parsedBudget,
        days: parsedDays,
        travelers: parsedTravelers,
        travelStyle,
        itinerary: itinerary as any,
      },
    });

    return NextResponse.json({ trip, itinerary }, { status: 201 });
  } catch (err) {
    console.error("Error in generate API route:", err);
    return NextResponse.json(
      { error: "Failed to generate itinerary. Please try again." },
      { status: 500 },
    );
  }
}
