"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Wand2, Users, Loader2, CheckCircle2, Lock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { indianCities, travelStyles } from "@/lib/data";
import { BufferingMap } from "./buffering-map";

export function TripPlanner() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [startLocation, setStartLocation] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
  const [loadingStartSuggestions, setLoadingStartSuggestions] = useState(false);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);

  const [destination, setDestination] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [loadingDestSuggestions, setLoadingDestSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");
  const [travelers, setTravelers] = useState("");
  const [travelStyle, setTravelStyle] = useState("Mid-Range");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    startLocation: string;
    destination: string;
    days: number;
    budget: number;
  } | null>(null);

  // Start Location suggestions logic (Local + AI)
  useEffect(() => {
    const query = startLocation.trim();
    if (!query) {
      setStartSuggestions(indianCities.slice(0, 6));
      return;
    }

    const local = indianCities
      .filter((city) => city.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
    setStartSuggestions(local);

    if (query.length < 2 || !isAuthenticated) return;

    setLoadingStartSuggestions(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const merged = Array.from(new Set([...local, ...data])).slice(0, 6);
            setStartSuggestions(merged);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch autocomplete suggestions:", err);
      } finally {
        setLoadingStartSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [startLocation, isAuthenticated]);

  // Destination suggestions logic (Local + AI)
  useEffect(() => {
    const query = destination.trim();
    if (!query) {
      setDestSuggestions(indianCities.slice(0, 6));
      return;
    }

    const local = indianCities
      .filter((city) => city.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
    setDestSuggestions(local);

    if (query.length < 2 || !isAuthenticated) return;

    setLoadingDestSuggestions(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const merged = Array.from(new Set([...local, ...data])).slice(0, 6);
            setDestSuggestions(merged);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch autocomplete suggestions:", err);
      } finally {
        setLoadingDestSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [destination, isAuthenticated]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!isAuthenticated) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLocation,
          destination,
          budget: Number(budget),
          days: Number(days),
          travelers: Number(travelers),
          travelStyle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate itinerary.");
        setLoading(false);
        return;
      }

      setSuccess({
        startLocation: data.itinerary.startLocation,
        destination: data.trip.destination,
        days: data.trip.days,
        budget: data.trip.budget,
      });
      router.push(`/trips/${data.trip.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="planner"
      className="relative z-10 -mt-12 px-4 pb-8 sm:-mt-16 sm:px-6 sm:pb-10 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <div className="gold-border rounded-2xl bg-charcoal-light/90 p-6 shadow-2xl shadow-black/50 sm:p-8 lg:p-10">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold tracking-wider text-gold uppercase">
              AI Trip Planner
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border-2 border-charcoal-light bg-secondary"
                  />
                ))}
              </div>
              <span>50,000+ trips planned</span>
            </div>
          </div>

          {!isAuthenticated && status !== "loading" && (
            <div className="mb-7 flex items-center gap-3 rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
              <Lock className="h-5 w-5 shrink-0 text-gold" />
              <p className="text-sm text-white/80">
                Sign in or continue as guest to generate your personalized itinerary.{" "}
                <Link
                  href="/sign-in?callbackUrl=/#planner"
                  className="font-medium text-gold hover:text-gold-light"
                >
                  Start now →
                </Link>
              </p>
            </div>
          )}          {loading ? (
            <div className="py-2">
              <BufferingMap startLocation={startLocation} destination={destination} />
            </div>
          ) : (
            <form onSubmit={handleGenerate}>
              <div className="grid gap-5 lg:grid-cols-8 lg:gap-4">
                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Starting Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={startLocation}
                      onChange={(e) => {
                        setStartLocation(e.target.value);
                        setShowStartSuggestions(true);
                      }}
                      onFocus={() => setShowStartSuggestions(true)}
                      onBlur={() => setShowStartSuggestions(false)}
                      placeholder="Start city"
                      required
                      disabled={!isAuthenticated || loading}
                      autoComplete="off"
                      className="h-11 border-white/10 bg-black/40 pl-9 text-white placeholder:text-white/30 disabled:opacity-50"
                    />

                    {showStartSuggestions &&
                      startSuggestions.length > 0 &&
                      isAuthenticated &&
                      !loading && (
                        <div className="absolute top-full right-0 left-0 z-30 mt-2 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-charcoal-light shadow-xl shadow-black/40">
                          {startSuggestions.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setStartLocation(city);
                                setShowStartSuggestions(false);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-gold/10 hover:text-gold"
                            >
                              <MapPin className="h-3.5 w-3.5 text-gold" />
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Destination
                  </label>
                  <div className="relative">
                    <Input
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setShowDestSuggestions(true);
                      }}
                      onFocus={() => setShowDestSuggestions(true)}
                      onBlur={() => setShowDestSuggestions(false)}
                      placeholder="Where do you want to go?"
                      required
                      disabled={!isAuthenticated || loading}
                      autoComplete="off"
                      className="h-11 border-white/10 bg-black/40 text-white placeholder:text-white/30 disabled:opacity-50"
                    />

                    {showDestSuggestions &&
                      destSuggestions.length > 0 &&
                      isAuthenticated &&
                      !loading && (
                        <div className="absolute top-full right-0 left-0 z-30 mt-2 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-charcoal-light shadow-xl shadow-black/40">
                          {destSuggestions.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setDestination(city);
                                setShowDestSuggestions(false);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-gold/10 hover:text-gold"
                            >
                              <MapPin className="h-3.5 w-3.5 text-gold" />
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Budget (₹)
                  </label>
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="15,000"
                    required
                    min={1000}
                    disabled={!isAuthenticated || loading}
                    className="h-11 border-white/10 bg-black/40 text-white placeholder:text-white/30 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Days
                  </label>
                  <Input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="5"
                    required
                    min={1}
                    max={30}
                    disabled={!isAuthenticated || loading}
                    className="h-11 border-white/10 bg-black/40 text-white placeholder:text-white/30 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Travelers
                  </label>
                  <div className="relative">
                    <Users className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      value={travelers}
                      onChange={(e) => setTravelers(e.target.value)}
                      placeholder="2"
                      required
                      min={1}
                      max={20}
                      disabled={!isAuthenticated || loading}
                      className="h-11 border-white/10 bg-black/40 pl-9 text-white placeholder:text-white/30 disabled:opacity-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Travel Style
                  </label>
                  <Select
                    value={travelStyle}
                    onValueChange={(v) => v && setTravelStyle(v)}
                    disabled={!isAuthenticated || loading}
                  >
                    <SelectTrigger className="h-11 w-full border-white/10 bg-black/40 text-white disabled:opacity-50">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-charcoal-light">
                      {travelStyles.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              {success && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <p className="font-medium text-white">
                      Itinerary generated for {success.destination}!
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      From {success.startLocation} · {success.days} days · ₹
                      {success.budget.toLocaleString("en-IN")} budget · Saved to your account
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-7 flex justify-end">
                {isAuthenticated ? (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full bg-gold font-semibold text-black hover:bg-gold-light sm:w-auto sm:px-10"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate My Itinerary
                      </>
                    )}
                  </Button>
                ) : (
                  <Link href="/sign-in?callbackUrl=/#planner" className="w-full sm:w-auto">
                    <Button
                      type="button"
                      size="lg"
                      className="w-full bg-gold font-semibold text-black hover:bg-gold-light sm:px-10"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Sign In or Continue as Guest
                    </Button>
                  </Link>
                )}
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </section>
  );
}
