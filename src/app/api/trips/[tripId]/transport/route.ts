import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to save transport selections." },
      { status: 401 }
    );
  }

  try {
    const { tripId } = await params;
    const body = await request.json();
    const { transportType, option } = body as {
      transportType: "train" | "returnTrain" | "bus";
      option: any;
    };

    if (!transportType) {
      return NextResponse.json(
        { error: "Transport type is required." },
        { status: 400 }
      );
    }

    if (!["train", "returnTrain", "bus"].includes(transportType)) {
      return NextResponse.json(
        { error: "Invalid transport type." },
        { status: 400 }
      );
    }

    // Verify ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: user.id,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or unauthorized." },
        { status: 404 }
      );
    }

    // Merge existing itinerary with selected transport option
    const currentItinerary = (trip.itinerary || {}) as Record<string, any>;
    const updatedItinerary = { ...currentItinerary };

    if (transportType === "train") {
      if (option) {
        updatedItinerary.selectedTrain = option;
      } else {
        delete updatedItinerary.selectedTrain;
      }
    } else if (transportType === "returnTrain") {
      if (option) {
        updatedItinerary.selectedReturnTrain = option;
      } else {
        delete updatedItinerary.selectedReturnTrain;
      }
    } else if (transportType === "bus") {
      if (option) {
        updatedItinerary.selectedBus = option;
      } else {
        delete updatedItinerary.selectedBus;
      }
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        itinerary: updatedItinerary,
      },
    });

    return NextResponse.json(
      { success: true, trip: updatedTrip },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating transport selection:", error);
    return NextResponse.json(
      { error: "Failed to update transport selection. Please try again." },
      { status: 500 }
    );
  }
}
