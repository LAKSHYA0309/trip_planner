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
      { error: "You must be signed in to update your itinerary." },
      { status: 401 }
    );
  }

  try {
    const { tripId } = await params;
    const body = await request.json();
    const { days } = body as { days: any[] };

    if (!days || !Array.isArray(days)) {
      return NextResponse.json(
        { error: "Invalid days payload." },
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

    // Merge existing itinerary with new days
    const currentItinerary = (trip.itinerary || {}) as Record<string, any>;
    const updatedItinerary = {
      ...currentItinerary,
      days,
    };

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
    console.error("Error updating itinerary days:", error);
    return NextResponse.json(
      { error: "Failed to update itinerary. Please try again." },
      { status: 500 }
    );
  }
}
