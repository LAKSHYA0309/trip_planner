import { Navbar } from "@/components/home/navbar";
import { Hero } from "@/components/home/hero";
import { TripPlanner } from "@/components/home/trip-planner";
import { PopularDestinations } from "@/components/home/popular-destinations";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyTravel } from "@/components/home/why-travel";
import { PopularItineraries } from "@/components/home/popular-itineraries";
import { BudgetFood } from "@/components/home/budget-food";
import { ExploreStats } from "@/components/home/explore-stats";
import { Testimonials } from "@/components/home/testimonials";
import { FinalCTA } from "@/components/home/final-cta";
import { Footer } from "@/components/home/footer";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <TripPlanner />
      <PopularDestinations />
      <HowItWorks />
      <WhyTravel />
      <PopularItineraries />
      <BudgetFood />
      <ExploreStats />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}
