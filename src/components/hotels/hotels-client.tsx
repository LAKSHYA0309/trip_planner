"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hotel,
  Wifi,
  Tv,
  Tv2,
  Waves,
  Star,
  Coffee,
  Search,
  SlidersHorizontal,
  Plus,
  Minus,
  X,
  ChevronRight,
  CalendarDays,
  Users,
  IndianRupee,
  Bed,
  Check,
  CheckCircle2,
  MapPin,
  Bookmark,
  Building,
  Loader2,
  Flame,
  Printer,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { indianCities } from "@/lib/data";

interface Trip {
  id: string;
  destination: string;
  budget: number;
  days: number;
  travelers: number;
  travelStyle: string;
  itinerary: any;
  createdAt: string;
}

interface HotelsPageClientProps {
  initialTrips: Trip[];
  isAuthenticated: boolean;
  userEmail?: string;
}

interface HotelData {
  id: string;
  name: string;
  city: string;
  image: string;
  category: "Budget" | "Mid-Range" | "Luxury";
  pricePerRoomPerNight: number;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  maxGuestsPerRoom: number;
  highlights: string[];
  vibe: string;
}

// Curated list of hotels in popular locations
const CURATED_HOTELS: HotelData[] = [
  // JAIPUR
  {
    id: "jp-lux-1",
    name: "Rajputana Heritage Grand Palace",
    city: "Jaipur",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80",
    category: "Luxury",
    pricePerRoomPerNight: 12500,
    rating: 4.9,
    reviewsCount: 184,
    amenities: ["Free Wifi", "Pool", "Spa & Gym", "Free Breakfast", "AC", "Restaurant & Bar"],
    maxGuestsPerRoom: 2,
    highlights: ["18th-century restored palace", "Traditional Rajasthani folk shows nightly", "Panoramic rooftop views of Amber Fort"],
    vibe: "Royal Heritage",
  },
  {
    id: "jp-mid-1",
    name: "The Amber View Boutique Resort",
    city: "Jaipur",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    category: "Mid-Range",
    pricePerRoomPerNight: 4500,
    rating: 4.6,
    reviewsCount: 312,
    amenities: ["Free Wifi", "Pool", "Free Breakfast", "AC", "Restaurant"],
    maxGuestsPerRoom: 2,
    highlights: ["Overlooking the Aravalli hills", "Authentic Rajasthani culinary classes", "Spacious rooms with private jharokha balconies"],
    vibe: "Elegant Comfort",
  },
  {
    id: "jp-bud-1",
    name: "Hawa Mahal Backpackers Inn",
    city: "Jaipur",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
    category: "Budget",
    pricePerRoomPerNight: 1100,
    rating: 4.2,
    reviewsCount: 156,
    amenities: ["Free Wifi", "AC", "Terrace Cafe", "Bicycle Rental"],
    maxGuestsPerRoom: 3,
    highlights: ["5-minute walk to Hawa Mahal", "Vibrant rooftop social lounge", "Budget-friendly shared dorms and private rooms"],
    vibe: "Backpacker Social",
  },
  // UDAIPUR
  {
    id: "ud-lux-1",
    name: "Lake Pichola Oberoi Vista",
    city: "Udaipur",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80",
    category: "Luxury",
    pricePerRoomPerNight: 16500,
    rating: 4.9,
    reviewsCount: 120,
    amenities: ["Free Wifi", "Pool", "Spa & Gym", "Free Breakfast", "AC", "Lake View Dining"],
    maxGuestsPerRoom: 2,
    highlights: ["Stunning sunset views over Lake Pichola", "Private boat transfers from city docks", "Personalized 24/7 butler service"],
    vibe: "Ultra Luxury",
  },
  {
    id: "ud-mid-1",
    name: "Mewar Castle Haveli Hotel",
    city: "Udaipur",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
    category: "Mid-Range",
    pricePerRoomPerNight: 3900,
    rating: 4.5,
    reviewsCount: 228,
    amenities: ["Free Wifi", "AC", "Free Breakfast", "Rooftop Cafe"],
    maxGuestsPerRoom: 2,
    highlights: ["Traditional hand-painted frescoes", "Steps from Udaipur City Palace", "Rooftop sunset view of Lake Pichola"],
    vibe: "Scenic Haveli",
  },
  {
    id: "ud-bud-1",
    name: "Lakefront Nomad Sanctuary",
    city: "Udaipur",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80",
    category: "Budget",
    pricePerRoomPerNight: 950,
    rating: 4.3,
    reviewsCount: 92,
    amenities: ["Free Wifi", "AC", "Common Kitchen", "Lake View"],
    maxGuestsPerRoom: 2,
    highlights: ["Budget stay on the ghats", "Co-working friendly common rooms", "Weekly cultural walk tours around Old City"],
    vibe: "Bohemian Cozy",
  },
  // GOA
  {
    id: "goa-lux-1",
    name: "The Baga Sands Premium Resort",
    city: "Goa",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&q=80",
    category: "Luxury",
    pricePerRoomPerNight: 14800,
    rating: 4.8,
    reviewsCount: 420,
    amenities: ["Free Wifi", "Pool", "Spa & Gym", "Free Breakfast", "Beach Access", "Open Bar"],
    maxGuestsPerRoom: 2,
    highlights: ["Direct private access to Calangute Beach", "Infinity pool with swim-up bar", "Award-winning seafood dining deck"],
    vibe: "Tropical Beach Resort",
  },
  {
    id: "goa-mid-1",
    name: "Casa de Oasis Boutique Stay",
    city: "Goa",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80",
    category: "Mid-Range",
    pricePerRoomPerNight: 5200,
    rating: 4.6,
    reviewsCount: 290,
    amenities: ["Free Wifi", "Pool", "Free Breakfast", "AC", "Restaurant"],
    maxGuestsPerRoom: 2,
    highlights: ["Portuguese-style historic villa suites", "Charming garden view corridors", "Bicycle rentals to explore local beaches"],
    vibe: "Portuguese Vintage",
  },
  {
    id: "goa-bud-1",
    name: "Anjuna Palms Surf Hostel",
    city: "Goa",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
    category: "Budget",
    pricePerRoomPerNight: 1200,
    rating: 4.4,
    reviewsCount: 380,
    amenities: ["Free Wifi", "AC", "Shared Kitchen", "Beach Access"],
    maxGuestsPerRoom: 4,
    highlights: ["Walking distance to Anjuna flea market", "Surfing lessons & rentals available", "Lively garden barbecue get-togethers"],
    vibe: "Backpacker Surf Vibe",
  },
  // KERALA
  {
    id: "ker-lux-1",
    name: "Kumarakom Lagoon Spa & Villa",
    city: "Kerala",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
    category: "Luxury",
    pricePerRoomPerNight: 13900,
    rating: 4.9,
    reviewsCount: 160,
    amenities: ["Free Wifi", "Pool", "Spa & Gym", "Free Breakfast", "AC", "Lake View"],
    maxGuestsPerRoom: 2,
    highlights: ["Overlooking the serene Vembanad lake", "Traditional Ayurvedic detox therapies", "Private villas with plunge pools"],
    vibe: "Backwater Serenity",
  },
  {
    id: "ker-mid-1",
    name: "Munnar Tea Hills Premium Resort",
    city: "Kerala",
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80",
    category: "Mid-Range",
    pricePerRoomPerNight: 4900,
    rating: 4.6,
    reviewsCount: 198,
    amenities: ["Free Wifi", "AC", "Free Breakfast", "Mountain View Resort"],
    maxGuestsPerRoom: 2,
    highlights: ["Spectacular balcony views of tea estates", "Guided morning cardamom estate walks", "Cozy bonfire settings in chilly evenings"],
    vibe: "Mist-covered Hills",
  },
  {
    id: "ker-bud-1",
    name: "Alleppey Houseboat Backpacker Hostel",
    city: "Kerala",
    image: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=600&q=80",
    category: "Budget",
    pricePerRoomPerNight: 1400,
    rating: 4.3,
    reviewsCount: 145,
    amenities: ["Free Wifi", "Breakfast Included", "AC", "Water View Deck"],
    maxGuestsPerRoom: 2,
    highlights: ["Unique floating hostel setup", "Authentic Kuttanad-style spicy fish curry", "Sunset canoeing down village canals"],
    vibe: "Rustic Backwaters",
  },
];

// Helper to generate dynamic hotels for non-curated cities
function generateMockHotels(city: string): HotelData[] {
  const formattedCity = city.trim();
  const seed = formattedCity.length;

  return [
    {
      id: `dyn-${formattedCity.toLowerCase()}-bud`,
      name: `${formattedCity} Backpackers & Co-Living`,
      city: formattedCity,
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
      category: "Budget",
      pricePerRoomPerNight: 950 + (seed % 5) * 150,
      rating: 4.1 + (seed % 4) * 0.2,
      reviewsCount: 45 + (seed % 10) * 12,
      amenities: ["Free Wifi", "AC", "Common Lounge", "Kitchen Access"],
      maxGuestsPerRoom: 3,
      highlights: ["Budget stay in prime location", "Superfast Wi-Fi for remote work", "Friendly local hosts and tours"],
      vibe: "Backpacker Hub",
    },
    {
      id: `dyn-${formattedCity.toLowerCase()}-mid`,
      name: `${formattedCity} Royal Residency & Suites`,
      city: formattedCity,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
      category: "Mid-Range",
      pricePerRoomPerNight: 3500 + (seed % 7) * 400,
      rating: 4.4 + (seed % 3) * 0.2,
      reviewsCount: 110 + (seed % 15) * 8,
      amenities: ["Free Wifi", "AC", "Free Breakfast", "Restaurant", "Pool"],
      maxGuestsPerRoom: 2,
      highlights: ["Modern stylish room designs", "Central business district location", "Complimentary multi-cuisine breakfast"],
      vibe: "Modern Comfort",
    },
    {
      id: `dyn-${formattedCity.toLowerCase()}-lux`,
      name: `The Grand Palace & Spa ${formattedCity}`,
      city: formattedCity,
      image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80",
      category: "Luxury",
      pricePerRoomPerNight: 9800 + (seed % 10) * 800,
      rating: 4.8 + (seed % 2) * 0.1,
      reviewsCount: 88 + (seed % 12) * 7,
      amenities: ["Free Wifi", "Pool", "Spa & Gym", "Free Breakfast", "AC", "Bar & Room Service"],
      maxGuestsPerRoom: 2,
      highlights: ["Premium world-class spa facilities", "Bespoke fine-dining gourmet experiences", "Private executive terraces and lounge access"],
      vibe: "Luxury Heritage",
    },
  ];
}

export function HotelsPageClient({
  initialTrips,
  isAuthenticated,
  userEmail,
}: HotelsPageClientProps) {
  // Input parameters
  const [destination, setDestination] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [budgetPerNight, setBudgetPerNight] = useState<number>(6000);
  const [guests, setGuests] = useState<number>(2);
  const [nights, setNights] = useState<number>(3);

  // Advanced Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // UI Selection States
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [customRooms, setCustomRooms] = useState<number | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>("none");
  const [savingToTrip, setSavingToTrip] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Voucher modal state
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [bookingCode, setBookingCode] = useState("");

  // Autocomplete suggestions for Indian cities
  const citySuggestions = useMemo(() => {
    const query = destination.trim().toLowerCase();
    if (!query) return indianCities.slice(0, 6);
    return indianCities
      .filter((city) => city.toLowerCase().includes(query))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(query);
        const bStarts = b.toLowerCase().startsWith(query);
        if (aStarts === bStarts) return a.localeCompare(b);
        return aStarts ? -1 : 1;
      })
      .slice(0, 6);
  }, [destination]);

  // Handle active Trip synchronization
  // When a user selects a trip to link, we pre-fill the destination, guest count, and nights
  useEffect(() => {
    if (selectedTripId && selectedTripId !== "none") {
      const matchedTrip = initialTrips.find((t) => t.id === selectedTripId);
      if (matchedTrip) {
        setDestination(matchedTrip.destination);
        setGuests(matchedTrip.travelers);
        setNights(matchedTrip.days);
        // Reset custom rooms so it recalculates based on new guest size
        setCustomRooms(null);

        // Pre-fill budget based on trip budget divided by days (daily budget available)
        const dailyTripBudget = Math.floor(matchedTrip.budget / matchedTrip.days);
        // Let's allocate around 45% of daily budget for hotels (standard travel planning ratio)
        setBudgetPerNight(Math.max(1000, Math.floor(dailyTripBudget * 0.8)));
      }
    }
  }, [selectedTripId, initialTrips]);

  // Calculate rooms needed
  const roomsNeeded = useMemo(() => {
    if (customRooms !== null) return customRooms;
    // Standard rule: 2 guests per room
    return Math.max(1, Math.ceil(guests / 2));
  }, [guests, customRooms]);

  // Load selected hotel from localStorage on initial render
  useEffect(() => {
    const saved = localStorage.getItem("selectedHotel");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedHotel(parsed);
      } catch (e) {
        console.error("Failed to parse saved hotel", e);
      }
    }
  }, []);

  // Save selected hotel to local storage on change
  const handleSelectHotel = (hotel: HotelData) => {
    setSelectedHotel(hotel);
    localStorage.setItem("selectedHotel", JSON.stringify(hotel));
    // Reset room customization for new selection
    setCustomRooms(null);
    setSaveError("");
    setSaveSuccessMsg("");
  };

  const handleDeselectHotel = () => {
    setSelectedHotel(null);
    localStorage.removeItem("selectedHotel");
    setCustomRooms(null);
    setSaveError("");
    setSaveSuccessMsg("");
  };

  // Compile list of available hotels
  const allHotels = useMemo(() => {
    // If a destination is entered, check if we have curated hotels for it
    const activeDest = destination.trim().toLowerCase();
    
    if (activeDest) {
      const curatedMatch = CURATED_HOTELS.filter(
        (h) => h.city.toLowerCase() === activeDest
      );
      if (curatedMatch.length > 0) {
        return curatedMatch;
      }
      
      // If we don't have curated, search if there is partial match
      const partialCuratedMatch = CURATED_HOTELS.filter((h) =>
        h.city.toLowerCase().includes(activeDest)
      );
      if (partialCuratedMatch.length > 0) {
        return partialCuratedMatch;
      }

      // Check if it's one of our Indian cities, generate mock hotels dynamically
      const inCityList = indianCities.some(
        (c) => c.toLowerCase() === activeDest
      );
      if (inCityList) {
        return generateMockHotels(destination);
      }

      // Otherwise generate on the fly for whatever they typed so they always get results
      return generateMockHotels(destination);
    }

    // Default: Show all curated hotels
    return CURATED_HOTELS;
  }, [destination]);

  // Filtered hotels based on pricing, category, rating, amenities, search terms
  const filteredHotels = useMemo(() => {
    return allHotels
      .filter((hotel) => {
        // Price limit per room
        // If they enter a budget, we want to allow showing hotels that match it
        // Or if category matches
        if (selectedCategory !== "All" && hotel.category !== selectedCategory) {
          return false;
        }

        // Star rating
        if (minRating > 0 && hotel.rating < minRating) {
          return false;
        }

        // Amenities check
        if (selectedAmenities.length > 0) {
          const hasAll = selectedAmenities.every((amenity) =>
            hotel.amenities.some((hAmenity) =>
              hAmenity.toLowerCase().includes(amenity.toLowerCase())
            )
          );
          if (!hasAll) return false;
        }

        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = hotel.name.toLowerCase().includes(q);
          const matchVibe = hotel.vibe.toLowerCase().includes(q);
          const matchHighlight = hotel.highlights.some((h) =>
            h.toLowerCase().includes(q)
          );
          if (!matchName && !matchVibe && !matchHighlight) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by price proximity to budget, or show under-budget first
        const aDiff = Math.abs(a.pricePerRoomPerNight - budgetPerNight);
        const bDiff = Math.abs(b.pricePerRoomPerNight - budgetPerNight);
        return aDiff - bDiff;
      });
  }, [allHotels, budgetPerNight, selectedCategory, minRating, selectedAmenities, searchQuery]);

  // Toggle amenities filter helper
  const handleToggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  // Connect hotel stay to database trip record
  const handleSaveToTrip = async () => {
    if (!selectedHotel) return;
    if (selectedTripId === "none") {
      setSaveError("Please select a trip from the list to link.");
      return;
    }

    setSavingToTrip(true);
    setSaveError("");
    setSaveSuccessMsg("");

    try {
      const calculatedTotal = selectedHotel.pricePerRoomPerNight * roomsNeeded * nights;
      const gstAmount = Math.round(calculatedTotal * 0.18);
      const finalPrice = calculatedTotal + gstAmount;

      const payload = {
        hotel: {
          id: selectedHotel.id,
          name: selectedHotel.name,
          city: selectedHotel.city,
          image: selectedHotel.image,
          pricePerRoomPerNight: selectedHotel.pricePerRoomPerNight,
          rooms: roomsNeeded,
          nights: nights,
          guests: guests,
          baseTotal: calculatedTotal,
          gst: gstAmount,
          grandTotal: finalPrice,
          rating: selectedHotel.rating,
          vibe: selectedHotel.vibe,
        },
      };

      const res = await fetch(`/api/trips/${selectedTripId}/hotel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update trip stay.");
      }

      setSaveSuccessMsg(`Success! Hotel attached to your trip.`);
      
      // Auto open voucher checkout modal
      const code = `BY-STAY-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      setBookingCode(code);
      setIsVoucherOpen(true);
    } catch (err: any) {
      setSaveError(err.message || "Something went wrong saving to your trip.");
    } finally {
      setSavingToTrip(false);
    }
  };

  // Generic checkout flow without linking to trip
  const handleLocalConfirm = () => {
    const code = `BY-STAY-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setBookingCode(code);
    setIsVoucherOpen(true);
  };

  // Pricing calculations for UI
  const priceCalculations = useMemo(() => {
    if (!selectedHotel) return { base: 0, gst: 0, total: 0 };
    const base = selectedHotel.pricePerRoomPerNight * roomsNeeded * nights;
    const gst = Math.round(base * 0.18);
    const total = base + gst;
    return { base, gst, total };
  }, [selectedHotel, roomsNeeded, nights]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/5 bg-charcoal-light/70 px-6 py-12 text-center shadow-xl sm:px-12 sm:py-16">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80')" }} />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Badge className="mb-4 bg-gold/15 text-gold border-gold/30 uppercase tracking-[0.2em]">Premium Accommodation Finder</Badge>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Discover Stays Tailored to <span className="text-gradient-gold">Your Budget</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Find and select curated boutique hotels, royal heritage palaces, and social hostels. Enter your party size and target rate, and book with smart automatic room calculations.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Search Form & Matches */}
        <div className="lg:col-span-8 space-y-6">
          {/* SEARCH & FILTERS BAR */}
          <div className="gold-border rounded-xl bg-card p-6 shadow-md">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gold">Search Configuration</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {/* Destination */}
              <div className="relative">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Destination City</label>
                <div className="relative">
                  <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Enter city (e.g. Jaipur)"
                    className="h-10 border-white/10 bg-black/40 pl-9 text-sm text-white placeholder:text-white/30"
                  />
                  {showSuggestions && citySuggestions.length > 0 && (
                    <div className="absolute top-full right-0 left-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-charcoal-light shadow-xl">
                      {citySuggestions.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onMouseDown={() => {
                            setDestination(city);
                            setShowSuggestions(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/80 hover:bg-gold/15 hover:text-gold"
                        >
                          <MapPin className="h-3.5 w-3.5 text-gold" />
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Budget/Night */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Max Budget / Night (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    value={budgetPerNight}
                    onChange={(e) => setBudgetPerNight(Math.max(0, Number(e.target.value)))}
                    className="h-10 border-white/10 bg-black/40 pl-9 text-sm text-white"
                  />
                </div>
              </div>

              {/* Travelers */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Guests</label>
                <div className="relative">
                  <Users className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    value={guests}
                    min={1}
                    max={20}
                    onChange={(e) => {
                      setGuests(Math.max(1, Number(e.target.value)));
                      setCustomRooms(null); // Reset room adjustment when guests change
                    }}
                    className="h-10 border-white/10 bg-black/40 pl-9 text-sm text-white"
                  />
                </div>
              </div>

              {/* Nights */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Stay Duration</label>
                <div className="relative">
                  <CalendarDays className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    value={nights}
                    min={1}
                    max={30}
                    onChange={(e) => setNights(Math.max(1, Number(e.target.value)))}
                    className="h-10 border-white/10 bg-black/40 pl-9 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            {/* Slider control for budget */}
            <div className="mt-4 flex items-center gap-4">
              <span className="text-xs text-muted-foreground">₹1,000</span>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={budgetPerNight}
                onChange={(e) => setBudgetPerNight(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-gold"
              />
              <span className="text-xs text-muted-foreground">₹25,000+</span>
            </div>

            {/* Synchronized Trip Banner if they have trips */}
            {isAuthenticated && initialTrips.length > 0 && (
              <div className="mt-5 flex flex-col gap-3 rounded-lg border border-gold/10 bg-gold/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-white/90">
                  <Bookmark className="h-4 w-4 text-gold shrink-0" />
                  <span>Sync hotel stay parameters directly from one of your active itineraries:</span>
                </div>
                <Select value={selectedTripId} onValueChange={(val) => setSelectedTripId(val || "none")}>
                  <SelectTrigger className="h-8 w-full border-white/10 bg-black/50 text-xs text-gold sm:w-52">
                    <SelectValue placeholder="Link to a trip" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-charcoal-light text-xs text-white">
                    <SelectItem value="none">No Trip Selected (Manual)</SelectItem>
                    {initialTrips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.destination} ({trip.days} days, {trip.travelers} pax)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* ADVANCED REFINEMENT FILTERS */}
          <div className="rounded-xl border border-white/5 bg-card/60 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Category Segment Selector */}
              <div className="flex flex-wrap gap-1.5">
                {["All", "Budget", "Mid-Range", "Luxury"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-md px-3 py-1 text-xs transition-all ${
                      selectedCategory === cat
                        ? "bg-gold text-black font-semibold"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {cat} Stays
                  </button>
                ))}
              </div>

              {/* Rating Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rating:</span>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                >
                  <option value={0}>All Ratings</option>
                  <option value={4.5}>4.5★ and above</option>
                  <option value={4.0}>4.0★ and above</option>
                </select>
              </div>

              {/* Text search query */}
              <div className="relative w-full md:w-56">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter by name/amenity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 border-white/10 bg-black/40 pl-8 text-xs text-white"
                />
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div className="mt-4 border-t border-white/5 pt-4">
              <span className="block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">Filter by Amenities</span>
              <div className="flex flex-wrap gap-3">
                {["Pool", "Spa", "Wifi", "Breakfast", "AC", "Beach"].map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => handleToggleAmenity(amenity)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                        isChecked
                          ? "border-gold bg-gold/10 text-gold font-medium"
                          : "border-white/5 bg-black/20 text-muted-foreground hover:bg-white/5 hover:text-white/80"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                      {amenity === "Wifi" && <Wifi className="h-3 w-3 shrink-0" />}
                      {amenity === "Pool" && <Waves className="h-3 w-3 shrink-0" />}
                      {amenity === "Breakfast" && <Coffee className="h-3 w-3 shrink-0" />}
                      {amenity === "Spa" && <Sparkles className="h-3 w-3 shrink-0" />}
                      {amenity === "AC" && <Flame className="h-3 w-3 rotate-180 shrink-0" />}
                      {amenity === "Beach" && <MapPin className="h-3 w-3 shrink-0" />}
                      <span>{amenity === "AC" ? "Air Conditioning" : amenity === "Beach" ? "Beach Access" : amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DYNAMIC HOTEL SEARCH RESULTS GRID */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold text-white">
                Best Accommodations in <span className="text-gold">{destination || "India"}</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                Showing {filteredHotels.length} match{filteredHotels.length !== 1 ? "es" : ""}
              </span>
            </div>

            {filteredHotels.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
                <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                <h4 className="mt-4 text-base font-semibold text-white">No hotel matches found</h4>
                <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
                  We couldn't find stays matching the active filters in this price category. Try relaxing your filters or budget slider.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {filteredHotels.map((hotel) => {
                  const isSelected = selectedHotel?.id === hotel.id;
                  const priceDiff = hotel.pricePerRoomPerNight - budgetPerNight;
                  const isUnderBudget = priceDiff <= 0;

                  // Dynamic recommendation matching tag
                  let matchBadge = { text: "Premium Fit", style: "border-gold/30 text-gold bg-gold/5" };
                  if (hotel.pricePerRoomPerNight < budgetPerNight * 0.7) {
                    matchBadge = { text: "Budget Saver", style: "border-green-500/30 text-green-400 bg-green-500/5" };
                  } else if (hotel.pricePerRoomPerNight > budgetPerNight) {
                    matchBadge = { text: "Premium Upgrade", style: "border-purple-500/30 text-purple-400 bg-purple-500/5" };
                  } else if (Math.abs(priceDiff) < 500) {
                    matchBadge = { text: "Perfect Fit", style: "border-gold bg-gold/15 text-white" };
                  }

                  return (
                    <article
                      key={hotel.id}
                      className={`gold-border group flex flex-col overflow-hidden rounded-xl bg-card transition-all duration-300 hover:shadow-lg hover:shadow-black/50 ${
                        isSelected ? "ring-2 ring-gold" : "opacity-95 hover:opacity-100"
                      }`}
                    >
                      {/* Image section */}
                      <div className="relative h-48 w-full overflow-hidden bg-black/20">
                        <Image
                          src={hotel.image}
                          alt={hotel.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 384px"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className={`${matchBadge.style} backdrop-blur-md`}>
                            {matchBadge.text}
                          </Badge>
                          <Badge className="bg-black/60 text-white backdrop-blur-md border-white/10">
                            {hotel.category}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-gold backdrop-blur-md">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          <span className="font-semibold">{hotel.rating}</span>
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="flex flex-1 flex-col p-5">
                        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gold" />
                          {hotel.city}, India · {hotel.vibe}
                        </span>
                        <h3 className="mt-2 text-base font-bold text-white group-hover:text-gold transition-colors">
                          {hotel.name}
                        </h3>

                        {/* Highlights checklist */}
                        <ul className="mt-3.5 space-y-1.5 text-xs text-muted-foreground border-b border-white/5 pb-3.5">
                          {hotel.highlights.map((h, index) => (
                            <li key={index} className="flex items-start gap-1.5">
                              <span className="text-gold shrink-0 mt-0.5">•</span>
                              <span className="leading-tight">{h}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Amenities Quick Row */}
                        <div className="my-3 flex flex-wrap gap-2 text-[10px] text-white/70">
                          {hotel.amenities.slice(0, 4).map((a) => (
                            <span key={a} className="rounded bg-secondary px-2 py-0.5 flex items-center gap-1">
                              {a.includes("Wifi") && <Wifi className="h-2.5 w-2.5 text-gold" />}
                              {a.includes("Pool") && <Waves className="h-2.5 w-2.5 text-gold" />}
                              {a.includes("Breakfast") && <Coffee className="h-2.5 w-2.5 text-gold" />}
                              {a.includes("AC") && <Flame className="h-2.5 w-2.5 text-gold rotate-180" />}
                              {!a.includes("Wifi") && !a.includes("Pool") && !a.includes("Breakfast") && !a.includes("AC") && <Bed className="h-2.5 w-2.5 text-gold" />}
                              {a}
                            </span>
                          ))}
                          {hotel.amenities.length > 4 && (
                            <span className="text-muted-foreground font-semibold">+{hotel.amenities.length - 4} more</span>
                          )}
                        </div>

                        {/* Room Recommendation breakdown */}
                        <div className="mt-auto rounded-lg bg-black/20 p-2.5 text-[11px] leading-tight text-white/60 flex items-center justify-between">
                          <span>Capacity per Room: Max {hotel.maxGuestsPerRoom} guests</span>
                          <span className="text-gold font-medium">Recommended: {roomsNeeded} room{roomsNeeded > 1 ? "s" : ""}</span>
                        </div>

                        {/* Pricing details & Action */}
                        <div className="mt-4 flex items-end justify-between pt-3 border-t border-white/5">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase">Price / Room / Night</span>
                            <div className="flex items-baseline gap-1 text-lg font-bold text-white">
                              <span>₹{hotel.pricePerRoomPerNight.toLocaleString("en-IN")}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              Group rate: ₹{(hotel.pricePerRoomPerNight * roomsNeeded).toLocaleString("en-IN")}/night
                            </span>
                          </div>

                          <Button
                            onClick={() => handleSelectHotel(hotel)}
                            size="sm"
                            className={`px-4 font-semibold text-xs ${
                              isSelected
                                ? "bg-white text-black hover:bg-white/90"
                                : "bg-gold text-black hover:bg-gold-light"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="mr-1 h-3.5 w-3.5" /> Selected
                              </>
                            ) : (
                              "Select Stay"
                            )}
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Stay Details Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            {/* STAY SUMMARY CARD */}
            <div className="gold-border rounded-xl bg-card p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-gold" />
                  Your Selected Stay
                </h3>
                {selectedHotel && (
                  <button
                    onClick={handleDeselectHotel}
                    className="text-xs text-muted-foreground hover:text-red-400"
                  >
                    Clear
                  </button>
                )}
              </div>

              {selectedHotel ? (
                <div className="space-y-4">
                  {/* Selected Hotel Card Brief */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-black/20">
                      <Image
                        src={selectedHotel.image}
                        alt={selectedHotel.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{selectedHotel.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gold" />
                        {selectedHotel.city}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-gold">
                        <Star className="h-3 w-3 fill-gold text-gold" />
                        <span>{selectedHotel.rating} ({selectedHotel.reviewsCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  {/* Room customization controls */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold text-white">Customize Booking Parameters</h5>
                    
                    {/* Room count adjustment */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Number of Rooms</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomRooms(Math.max(1, roomsNeeded - 1))}
                          className="flex h-6 w-6 items-center justify-center rounded bg-secondary hover:bg-white/10 text-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-white">{roomsNeeded}</span>
                        <button
                          type="button"
                          onClick={() => setCustomRooms(roomsNeeded + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-secondary hover:bg-white/10 text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Nights count adjustment */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Nights Stay</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNights(Math.max(1, nights - 1))}
                          className="flex h-6 w-6 items-center justify-center rounded bg-secondary hover:bg-white/10 text-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-white">{nights}</span>
                        <button
                          type="button"
                          onClick={() => setNights(nights + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-secondary hover:bg-white/10 text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  {/* Cost breakdown */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Room Rate ({roomsNeeded} room{roomsNeeded > 1 ? "s" : ""} × {nights} night{nights > 1 ? "s" : ""})</span>
                      <span className="text-white">₹{selectedHotel.pricePerRoomPerNight.toLocaleString("en-IN")} / night</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Base Accommodation Cost</span>
                      <span className="text-white">₹{priceCalculations.base.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST Taxes & Fees (18%)</span>
                      <span className="text-white">₹{priceCalculations.gst.toLocaleString("en-IN")}</span>
                    </div>
                    <Separator className="my-1.5 bg-white/5" />
                    <div className="flex justify-between text-sm font-bold text-white">
                      <span>Total Estimated Cost</span>
                      <span className="text-gold">₹{priceCalculations.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Attachment options for signed-in users */}
                  {isAuthenticated && initialTrips.length > 0 && (
                    <div className="rounded-lg bg-black/30 p-4 border border-white/5 space-y-3 mt-4">
                      <span className="text-xs font-semibold text-white block">Link Accommodation to Itinerary</span>
                      <Select value={selectedTripId} onValueChange={(val) => setSelectedTripId(val || "none")}>
                        <SelectTrigger className="h-9 w-full border-white/10 bg-black/40 text-xs text-white">
                          <SelectValue placeholder="Choose a trip..." />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-charcoal-light text-xs text-white">
                          <SelectItem value="none">Choose a trip...</SelectItem>
                          {initialTrips.map((trip) => (
                            <SelectItem key={trip.id} value={trip.id}>
                              {trip.destination} ({trip.days}d · {trip.travelers} guests)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        Linking this hotel updates your generated itinerary's budget details and shows the hotel voucher right in your trip dashboard.
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 space-y-2.5">
                    {selectedTripId !== "none" ? (
                      <Button
                        onClick={handleSaveToTrip}
                        disabled={savingToTrip}
                        className="w-full bg-gold font-bold text-black hover:bg-gold-light"
                      >
                        {savingToTrip ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving stay...
                          </>
                        ) : (
                          <>
                            <Bookmark className="mr-2 h-4 w-4" /> Save to Trip & Confirm
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleLocalConfirm}
                        className="w-full bg-gold font-bold text-black hover:bg-gold-light"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Selection
                      </Button>
                    )}

                    {saveError && (
                      <p className="text-xs font-medium text-red-400 mt-2 bg-red-500/10 p-2 rounded">
                        {saveError}
                      </p>
                    )}
                    {saveSuccessMsg && (
                      <p className="text-xs font-medium text-green-400 mt-2 bg-green-500/10 p-2 rounded flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> {saveSuccessMsg}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Bed className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    No hotel selected yet. Explore hotels in your destination, view room rates, and click "Select Stay" to configure your booking details.
                  </p>
                </div>
              )}
            </div>

            {/* QUICK STATS INSIGHT */}
            <div className="rounded-xl border border-white/5 bg-secondary/30 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Planning Tips</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <Sparkles className="h-4 w-4 text-gold shrink-0" />
                  <span><strong>Room Rates:</strong> Standard luxury packages usually include breakfast. Check cards to filter for Free Breakfast options.</span>
                </li>
                <li className="flex gap-2">
                  <Info className="h-4 w-4 text-gold shrink-0" />
                  <span><strong>Indian GST Policy:</strong> Luxury hotel tariffs above ₹7,500/night incur 18% GST (already computed in your stay summary drawer).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* STUNNING VOUCHER MODAL */}
      <AnimatePresence>
        {isVoucherOpen && selectedHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="gold-border relative w-full max-w-xl overflow-hidden rounded-2xl bg-card shadow-2xl"
            >
              {/* Header card with gradient background */}
              <div className="relative bg-gradient-to-r from-gold/25 via-gold/10 to-transparent p-6 sm:p-8">
                <button
                  onClick={() => setIsVoucherOpen(false)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-gold/40">
                    <Building className="h-4 w-4 text-gold" />
                  </div>
                  <span className="text-xs font-bold tracking-widest text-gold uppercase">BharatYatra Accommodations</span>
                </div>
                
                <h2 className="mt-3 font-heading text-2xl font-bold text-white sm:text-3xl">
                  Stay Booking Voucher
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confirming your selected stay details at {selectedHotel.city}
                </p>
              </div>

              {/* Voucher main sheet */}
              <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Success Banner */}
                <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-xs text-green-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div>
                    <span className="font-semibold block">Stay Confirmed & Attached Successfully!</span>
                    <span className="text-muted-foreground text-[11px]">Your receipt voucher code has been registered on your trip card dashboard.</span>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid gap-4 sm:grid-cols-2 text-xs border border-white/5 rounded-lg bg-black/20 p-4">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Booking Reference</span>
                    <span className="font-mono text-sm font-bold text-gold">{bookingCode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Guest E-mail</span>
                    <span className="font-medium text-white">{userEmail || "guest@bharatyatra.local"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <Separator className="my-1 bg-white/5" />
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Hotel Accommodation</span>
                    <span className="font-bold text-white text-sm">{selectedHotel.name}</span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">{selectedHotel.city}, India</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Stay Parameters</span>
                    <span className="font-medium text-white text-sm">{nights} Nights · {guests} Guests</span>
                    <span className="text-[11px] text-gold block mt-0.5">Rooms reserved: {roomsNeeded} Double Bed</span>
                  </div>
                </div>

                {/* Receipt breakdown table */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Voucher Price Summary</h4>
                  <div className="text-xs space-y-1.5 border-t border-white/5 pt-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Room Tariff ({roomsNeeded} room{roomsNeeded > 1 ? "s" : ""} × {nights} night{nights > 1 ? "s" : ""})</span>
                      <span>₹{(selectedHotel.pricePerRoomPerNight * roomsNeeded * nights).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Applicable GST Tax (18%)</span>
                      <span>₹{priceCalculations.gst.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-2 text-sm font-bold text-white">
                      <span>Grand Total Paid</span>
                      <span className="text-gold">₹{priceCalculations.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Print/Control Area */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      if (typeof window !== "undefined") window.print();
                    }}
                    variant="outline"
                    className="flex-1 border-white/10 text-white hover:bg-white/5"
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print Voucher
                  </Button>
                  
                  {selectedTripId !== "none" ? (
                    <Link href={`/trips/${selectedTripId}`} className="flex-1">
                      <Button className="w-full bg-gold font-bold text-black hover:bg-gold-light">
                        Go to Trip Board <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => setIsVoucherOpen(false)}
                      className="flex-1 bg-gold font-bold text-black hover:bg-gold-light"
                    >
                      Close Voucher
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple local fallback icon component in case the imports from lucide are slow
function Info(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
