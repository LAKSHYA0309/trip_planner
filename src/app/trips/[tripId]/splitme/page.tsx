import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { TripClient } from "@/components/trips/trip-client";

export default async function SplitMePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const user = await requireUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { tripId } = await params;
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: user.id,
    },
  });

  if (!trip) {
    notFound();
  }

  // Ensure JSON serialization safety for NextJS props
  const serializedTrip = {
    ...trip,
    createdAt: trip.createdAt.toISOString(),
  };

  return <TripClient trip={serializedTrip} viewMode="splitme" />;
}
