import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/home/navbar";
import { Footer } from "@/components/home/footer";
import { HotelsPageClient } from "@/components/hotels/hotels-client";

export default async function HotelsPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);

  let trips: Array<{
    id: string;
    destination: string;
    budget: number;
    days: number;
    travelers: number;
    travelStyle: string;
    itinerary: any;
    createdAt: Date;
  }> = [];

  if (session?.user?.id) {
    trips = await prisma.trip.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        destination: true,
        budget: true,
        days: true,
        travelers: true,
        travelStyle: true,
        itinerary: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Ensure JSON serialization safety for NextJS props
  const serializedTrips = trips.map((trip) => ({
    ...trip,
    createdAt: trip.createdAt.toISOString() as any,
  }));

  return (
    <main className="min-h-screen overflow-x-hidden bg-background pt-16">
      <Navbar />
      <HotelsPageClient
        initialTrips={serializedTrips}
        isAuthenticated={isAuthenticated}
        userEmail={session?.user?.email ?? undefined}
      />
      <Footer />
    </main>
  );
}
