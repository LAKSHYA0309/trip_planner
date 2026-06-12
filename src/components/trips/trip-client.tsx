"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bus,
  CalendarDays,
  Clock,
  IndianRupee,
  Landmark,
  MapPin,
  Star,
  Train,
  Users,
  Hotel,
  Sparkles,
  Bed,
  CheckCircle2,
  ExternalLink,
  Plus,
  Printer,
  Check,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeafletMap } from "./leaflet-map";

type TransportOption = {
  rank: number;
  name: string;
  type: string;
  duration: string;
  fare: number;
  comfort: string;
  note: string;
};

type ItineraryDay = {
  day: number;
  title: string;
  activities: any[];
  estimatedCost: number;
  bestPlace?: string;
  bestFood?: string;
};

type ItineraryDetails = {
  startLocation?: string;
  summary?: string;
  totalBudget?: number;
  dailyBudget?: number;
  transportOptions?: {
    trains?: TransportOption[];
    returnTrains?: TransportOption[];
    buses?: TransportOption[];
  };
  days?: ItineraryDay[];
  selectedHotel?: {
    id: string;
    name: string;
    city: string;
    image: string;
    pricePerRoomPerNight: number;
    rooms: number;
    nights: number;
    guests: number;
    baseTotal: number;
    gst: number;
    grandTotal: number;
    rating: number;
    vibe: string;
  };
  selectedTrain?: TransportOption;
  selectedReturnTrain?: TransportOption;
  selectedBus?: TransportOption;
  budgetBreakdown?: {
    hotel: number;
    food: number;
    transport: number;
    attractions: number;
  };
  splitme?: {
    members: string[];
    expenses: any[];
  };
  aiGenerated?: boolean;
};

interface Trip {
  id: string;
  destination: string;
  budget: number;
  days: number;
  travelers: number;
  travelStyle: string;
  itinerary: any;
  createdAt: string | Date;
}

interface TripClientProps {
  trip: Trip;
  viewMode?: "bookings" | "itinerary" | "splitme";
}

const DEFAULT_SPLITME = { members: [], expenses: [] };
const DEFAULT_ARRAY: any[] = [];

function formatFare(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function calculateSettlements(members: string[], expenses: any[]) {
  const balances: Record<string, number> = {};
  members.forEach(m => { balances[m] = 0; });

  expenses.forEach(exp => {
    const amount = Number(exp.amount) || 0;
    const paidBy = exp.paidBy;
    const sharedBy = exp.sharedBy || members;
    if (sharedBy.length === 0) return;

    if (paidBy && balances[paidBy] !== undefined) {
      balances[paidBy] += amount;
    }
    const share = amount / sharedBy.length;
    sharedBy.forEach((m: string) => {
      if (balances[m] !== undefined) {
        balances[m] -= share;
      }
    });
  });

  const debtors = Object.keys(balances)
    .map(name => ({ name, balance: balances[name] }))
    .filter(x => x.balance < -0.01)
    .sort((a, b) => a.balance - b.balance);

  const creditors = Object.keys(balances)
    .map(name => ({ name, balance: balances[name] }))
    .filter(x => x.balance > 0.01)
    .sort((a, b) => b.balance - a.balance);

  const settlements: { from: string; to: string; amount: number }[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const oweAmount = Math.min(-debtor.balance, creditor.balance);
    if (oweAmount > 0.01) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Number(oweAmount.toFixed(2))
      });
    }

    debtor.balance += oweAmount;
    creditor.balance -= oweAmount;

    if (Math.abs(debtor.balance) < 0.01) dIdx++;
    if (Math.abs(creditor.balance) < 0.01) cIdx++;
  }

  return { balances, settlements };
}

export function TripClient({ trip, viewMode = "bookings" }: TripClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Auto-dismiss notification after 3.5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const [activeTab, setActiveTab] = useState<"train" | "returnTrain" | "bus">("train");

  const itinerary = useMemo(() => {
    return (trip.itinerary || {}) as ItineraryDetails;
  }, [trip.itinerary]);

  // SplitMe Expense Splitter State
  const splitme = itinerary.splitme || DEFAULT_SPLITME;
  const initialMembers = useMemo(() => {
    const m = splitme.members || DEFAULT_ARRAY;
    return m.length > 0
      ? m
      : Array.from({ length: trip.travelers }, (_, i) => `Traveler ${i + 1}`);
  }, [splitme.members, trip.travelers]);

  const [members, setMembers] = useState<string[]>(initialMembers);
  const [localExpenses, setLocalExpenses] = useState<any[]>(splitme.expenses || DEFAULT_ARRAY);

  // Sync state if DB value changes
  useEffect(() => {
    setMembers(prev => {
      if (prev.length === initialMembers.length && prev.every((v, i) => v === initialMembers[i])) {
        return prev;
      }
      return initialMembers;
    });

    const dbExpenses = splitme.expenses || DEFAULT_ARRAY;
    setLocalExpenses(prev => {
      if (JSON.stringify(prev) === JSON.stringify(dbExpenses)) {
        return prev;
      }
      return dbExpenses;
    });
  }, [initialMembers, splitme.expenses]);

  const [newMemberName, setNewMemberName] = useState("");
  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpPaidBy, setNewExpPaidBy] = useState(initialMembers[0] || "");
  const [newExpSharedBy, setNewExpSharedBy] = useState<string[]>(initialMembers);

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  // Trigger full AI Day plans generation if not yet generated
  useEffect(() => {
    if (viewMode === "itinerary" && !itinerary.aiGenerated && !isGeneratingAll && !generationError) {
      const generateItinerary = async () => {
        setIsGeneratingAll(true);
        setErrorMessage("");
        try {
          const res = await fetch(`/api/trips/${trip.id}/itinerary/generate-all`, {
            method: "POST"
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to generate itinerary.");
          }
          setNotification({
            message: "AI Day-by-Day itinerary generated successfully!",
            type: "success"
          });
          startTransition(() => {
            router.refresh();
          });
        } catch (err: any) {
          setGenerationError(err.message || "Failed to generate AI itinerary.");
          setErrorMessage(err.message || "Failed to generate AI itinerary.");
        } finally {
          setIsGeneratingAll(false);
        }
      };
      generateItinerary();
    }
  }, [viewMode, itinerary.aiGenerated, trip.id, isGeneratingAll, generationError]);

  // Sync PaidBy / SharedBy if members changes
  useEffect(() => {
    if (members.length > 0) {
      if (!members.includes(newExpPaidBy)) {
        setNewExpPaidBy(members[0]);
      }
      setNewExpSharedBy(prev => {
        const filtered = prev.filter(m => members.includes(m));
        if (filtered.length === prev.length && filtered.every((v, i) => v === prev[i])) {
          return prev;
        }
        return filtered.length > 0 ? filtered : members;
      });
    } else {
      setNewExpPaidBy("");
      setNewExpSharedBy(DEFAULT_ARRAY);
    }
  }, [members]);

  const [isSavingExpenses, setIsSavingExpenses] = useState(false);

  const handleSaveExpenses = async (updatedMembers: string[], updatedExpenses: any[]) => {
    setIsSavingExpenses(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/trips/${trip.id}/splitme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: updatedMembers, expenses: updatedExpenses }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save expenses.");
      }
      setNotification({
        message: "Expenses saved successfully!",
        type: "success",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save expenses.");
    } finally {
      setIsSavingExpenses(false);
    }
  };

  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    if (members.includes(name)) {
      setErrorMessage("Member name must be unique.");
      return;
    }
    const updated = [...members, name];
    setMembers(updated);
    setNewMemberName("");
    setErrorMessage("");
    setNewExpSharedBy(prev => [...prev, name]);
    if (newExpPaidBy === "") {
      setNewExpPaidBy(name);
    }
    handleSaveExpenses(updated, localExpenses);
  };

  const handleDeleteMember = (name: string) => {
    if (members.length <= 1) {
      setErrorMessage("SplitMe needs at least one member.");
      return;
    }
    const updatedMembers = members.filter(x => x !== name);
    const updatedExpenses = localExpenses.map(exp => ({
      ...exp,
      paidBy: exp.paidBy === name ? updatedMembers[0] || "" : exp.paidBy,
      sharedBy: exp.sharedBy ? exp.sharedBy.filter((x: string) => x !== name) : updatedMembers,
    })).filter(exp => exp.paidBy !== "");

    setMembers(updatedMembers);
    setLocalExpenses(updatedExpenses);
    if (newExpPaidBy === name) {
      setNewExpPaidBy(updatedMembers[0] || "");
    }
    setNewExpSharedBy(prev => prev.filter(x => x !== name));
    handleSaveExpenses(updatedMembers, updatedExpenses);
  };

  const handleAddExpense = () => {
    const desc = newExpDesc.trim();
    const amt = Number(newExpAmount);
    const paidBy = newExpPaidBy;
    const sharedBy = newExpSharedBy;

    if (!desc) return;
    if (!amt || amt <= 0) {
      setErrorMessage("Please enter a valid amount.");
      return;
    }
    if (!paidBy) {
      setErrorMessage("Please select who paid.");
      return;
    }
    if (sharedBy.length === 0) {
      setErrorMessage("Select at least one member to split with.");
      return;
    }

    const newExpense = {
      description: desc,
      amount: amt,
      paidBy,
      sharedBy,
    };

    const updatedExpenses = [...localExpenses, newExpense];
    setLocalExpenses(updatedExpenses);
    setNewExpDesc("");
    setNewExpAmount("");
    setErrorMessage("");
    handleSaveExpenses(members, updatedExpenses);
  };

  const handleDeleteExpense = (idx: number) => {
    const updatedExpenses = localExpenses.filter((_, i) => i !== idx);
    setLocalExpenses(updatedExpenses);
    handleSaveExpenses(members, updatedExpenses);
  };

  const { balances, settlements } = useMemo(() => {
    return calculateSettlements(members, localExpenses);
  }, [members, localExpenses]);

  // Helpers to deal with string vs object activities
  const getActivityText = (activity: any): string => {
    if (typeof activity === "string") return activity;
    return activity?.text || "";
  };

  const isActivityCompleted = (activity: any): boolean => {
    if (typeof activity === "string") return false;
    return !!activity?.completed;
  };

  // 1. Toggle completed state
  const handleToggleActivity = async (dayNumber: number, activityIndex: number) => {
    if (!itinerary.days) return;
    
    const updatedDays = itinerary.days.map((day) => {
      if (day.day !== dayNumber) return day;
      
      const updatedActivities = day.activities.map((act, idx) => {
        if (idx !== activityIndex) return act;
        
        if (typeof act === "string") {
          return { text: act, completed: true };
        } else {
          return { ...(act as any), completed: !(act as any).completed };
        }
      });
      
      return { ...day, activities: updatedActivities };
    });

    await saveItineraryDays(updatedDays);
  };

  // 2. Add custom activity
  const [newActivityTexts, setNewActivityTexts] = useState<Record<number, string>>({});

  const handleAddActivity = async (dayNumber: number) => {
    const text = newActivityTexts[dayNumber]?.trim();
    if (!text || !itinerary.days) return;

    const updatedDays = itinerary.days.map((day) => {
      if (day.day !== dayNumber) return day;
      
      const normalizedActivities = day.activities.map((act) => 
        typeof act === "string" ? { text: act, completed: false } : act
      );
      
      return {
        ...day,
        activities: [...normalizedActivities, { text, completed: false }]
      };
    });

    setNewActivityTexts(prev => ({ ...prev, [dayNumber]: "" }));
    await saveItineraryDays(updatedDays);
  };

  // 3. Delete activity
  const handleDeleteActivity = async (dayNumber: number, activityIndex: number) => {
    if (!itinerary.days) return;

    const updatedDays = itinerary.days.map((day) => {
      if (day.day !== dayNumber) return day;
      
      const updatedActivities = day.activities.filter((_, idx) => idx !== activityIndex);
      return { ...day, activities: updatedActivities };
    });

    await saveItineraryDays(updatedDays);
  };

  // 4. Save to database helper
  const saveItineraryDays = async (updatedDays: any[]) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/itinerary/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: updatedDays }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update itinerary.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save itinerary changes.");
    }
  };

  // 5. AI Refine Day Itinerary
  const [aiPrompts, setAiPrompts] = useState<Record<number, string>>({});
  const [refiningDays, setRefiningDays] = useState<Record<number, boolean>>({});

  const handleAiRefine = async (dayNumber: number) => {
    const prompt = aiPrompts[dayNumber]?.trim();
    if (!prompt) return;

    setRefiningDays(prev => ({ ...prev, [dayNumber]: true }));
    setErrorMessage("");

    try {
      const res = await fetch(`/api/trips/${trip.id}/itinerary/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber, prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to refine with AI.");
      }

      setAiPrompts(prev => ({ ...prev, [dayNumber]: "" }));
      
      setNotification({
        message: `Day ${dayNumber} plan revised by AI!`,
        type: "success"
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || "AI refinement failed.");
    } finally {
      setRefiningDays(prev => ({ ...prev, [dayNumber]: false }));
    }
  };

// We already defined itinerary inside export function block above, so we keep this empty

  const trains = itinerary.transportOptions?.trains ?? DEFAULT_ARRAY;
  const returnTrains = itinerary.transportOptions?.returnTrains ?? DEFAULT_ARRAY;
  const buses = itinerary.transportOptions?.buses ?? DEFAULT_ARRAY;
  const startLocation = itinerary.startLocation ?? "Your start city";

  // Selected states directly derived from the database (synced via router.refresh)
  const selectedHotel = itinerary.selectedHotel;
  const selectedTrain = itinerary.selectedTrain;
  const selectedReturnTrain = itinerary.selectedReturnTrain;
  const selectedBus = itinerary.selectedBus;

  // Real-time pricing calculations
  const prices = useMemo(() => {
    const hotelCost = selectedHotel?.grandTotal ?? 0;
    const trainCost = selectedTrain ? selectedTrain.fare * trip.travelers : 0;
    const returnTrainCost = selectedReturnTrain ? selectedReturnTrain.fare * trip.travelers : 0;
    const busCost = selectedBus ? selectedBus.fare * trip.travelers : 0;

    const transportCost = trainCost + returnTrainCost + busCost;
    const totalSelected = hotelCost + transportCost;
    const remaining = trip.budget - totalSelected;
    const percentUsed = Math.min(100, Math.round((totalSelected / trip.budget) * 100));

    return {
      hotelCost,
      trainCost,
      returnTrainCost,
      busCost,
      transportCost,
      totalSelected,
      remaining,
      percentUsed,
    };
  }, [selectedHotel, selectedTrain, selectedReturnTrain, selectedBus, trip.travelers, trip.budget]);

  const activeTransport = useMemo(() => {
    if (activeTab === "train") {
      return {
        label: "Departure Train Options",
        icon: Train,
        options: trains,
        type: "train" as const,
        selectedName: selectedTrain?.name,
      };
    }
    if (activeTab === "returnTrain") {
      return {
        label: "Return Train Options",
        icon: Train,
        options: returnTrains,
        type: "returnTrain" as const,
        selectedName: selectedReturnTrain?.name,
      };
    }
    return {
      label: "Best Bus Options",
      icon: Bus,
      options: buses,
      type: "bus" as const,
      selectedName: selectedBus?.name,
    };
  }, [activeTab, trains, returnTrains, buses, selectedTrain, selectedReturnTrain, selectedBus]);

  // Handle selecting / deselecting options
  const handleSelectTransport = async (
    type: "train" | "returnTrain" | "bus",
    option: TransportOption | null
  ) => {
    setErrorMessage("");
    
    // Call api to persist selection
    try {
      const res = await fetch(`/api/trips/${trip.id}/transport`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transportType: type,
          option,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save selection.");
      }

      // Refresh the page data from server component (re-running layout prisma load)
      startTransition(() => {
        router.refresh();
        const transportLabel = type === 'train' ? 'Departure Train' : type === 'returnTrain' ? 'Return Train' : 'Bus';
        if (option) {
          setNotification({
            message: `Selected ${transportLabel}: ${option.name}`,
            type: "success"
          });
        } else {
          setNotification({
            message: `Deselected ${transportLabel}`,
            type: "info"
          });
        }
      });
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Navigation & Header Actions */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to planner
          </Link>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={handlePrint}
              className="bg-gold font-semibold text-black hover:bg-gold-light shadow-lg hover:shadow-gold/15"
            >
              <Printer className="mr-2 h-4 w-4" />
              Export PDF Travel Guide
            </Button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
                <Landmark className="h-5 w-5 text-gold" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold tracking-[0.2em] text-white">
                  BHARAT
                </span>
                <span className="text-[10px] font-medium tracking-[0.35em] text-gold">
                  YATRA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs Navigation */}
        <div className="mb-8 border-b border-white/5 pb-2 no-print">
          <div className="flex gap-6">
            <Link
              href={`/trips/${trip.id}`}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                viewMode === "bookings"
                  ? "border-gold text-gold font-bold"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              Bookings & Travel Options
            </Link>
            <Link
              href={`/trips/${trip.id}/itinerary`}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                viewMode === "itinerary"
                  ? "border-gold text-gold font-bold"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              Day-by-Day Plan
            </Link>
            <Link
              href={`/trips/${trip.id}/splitme`}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                viewMode === "splitme"
                  ? "border-gold text-gold font-bold"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              SplitMe (Expense Splitter)
            </Link>
          </div>
        </div>

        {/* PRINT ONLY HEADER */}
        <div className="hidden print:flex items-center justify-between border-b border-gold/30 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/30">
              <Landmark className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-[0.15em] text-gold uppercase leading-tight">
                BHARAT YATRA
              </h1>
              <p className="text-xs text-muted-foreground font-medium tracking-wide">
                Your AI-Powered Travel Guide & Itinerary
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Generated On</p>
            <p className="text-sm font-semibold text-white">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-red-400 no-print">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Banner Section */}
        <section className="gold-border rounded-2xl bg-charcoal-light/90 p-6 shadow-2xl shadow-black/40 sm:p-8 lg:p-10 relative overflow-hidden no-print">
          <div className="absolute top-0 right-0 p-8 opacity-10 no-print">
            <Sparkles className="h-32 w-32 text-gold animate-pulse" />
          </div>
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            Generated Trip Plan
          </p>
          <h1 className="mt-4 font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {startLocation} to{" "}
            <span className="text-gradient-gold">{trip.destination}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {itinerary.summary ??
              `${trip.days}-day trip from ${startLocation} to ${trip.destination}.`}
          </p>

          <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-black/30 p-4 ring-1 ring-white/5 avoid-break">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-gold" />
                Duration
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {trip.days} days
              </p>
            </div>
            <div className="rounded-xl bg-black/30 p-4 ring-1 ring-white/5 avoid-break">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <IndianRupee className="h-4 w-4 text-gold" />
                Budget
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {formatFare(trip.budget)}
              </p>
            </div>
            <div className="rounded-xl bg-black/30 p-4 ring-1 ring-white/5 avoid-break">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-gold" />
                Travelers
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {trip.travelers} Pax
              </p>
            </div>
            <div className="rounded-xl bg-black/30 p-4 ring-1 ring-white/5 avoid-break">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-gold" />
                Style
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {trip.travelStyle}
              </p>
            </div>
          </div>
        </section>

        {/* REAL-TIME BUDGET & TRIP SUMMARY DASHBOARD */}
        {viewMode === "bookings" && (
          <section className="mt-10 gold-border rounded-xl bg-card p-6 shadow-lg relative overflow-hidden avoid-break no-print">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold" />
                  Trip Planner Budget Tracker
                </h2>
                <span className="text-sm font-semibold text-gold">
                  {prices.percentUsed}% Allocated
                </span>
              </div>
              {/* Progress Bar */}
              <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    prices.percentUsed > 100
                      ? "bg-red-500 shadow-[0_0_8px_#ef4444]"
                      : prices.percentUsed > 85
                      ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                      : "bg-gradient-to-r from-gold to-gold-light shadow-[0_0_8px_#c9a227]"
                  }`}
                  style={{ width: `${prices.percentUsed}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5 text-xs">
                <div>
                  <span className="text-muted-foreground block">Selected Hotel Stay</span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {prices.hotelCost > 0 ? formatFare(prices.hotelCost) : "None selected"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Selected Transport</span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {prices.transportCost > 0 ? formatFare(prices.transportCost) : "None selected"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total Selections</span>
                  <span className="font-bold text-white mt-0.5 block">
                    {formatFare(prices.totalSelected)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Remaining Budget</span>
                  <span
                    className={`font-bold mt-0.5 block ${
                      prices.remaining >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatFare(prices.remaining)} {prices.remaining < 0 ? "(Overbudget)" : ""}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-white mb-1">Selected Choices Summary:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-1.5">
                    <Hotel className="h-3.5 w-3.5 text-gold shrink-0" />
                    <span className="truncate max-w-[180px]">
                      {selectedHotel ? selectedHotel.name : "Stays: Pending"}
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Train className="h-3.5 w-3.5 text-gold shrink-0" />
                    <span className="truncate max-w-[180px]">
                      {selectedTrain ? selectedTrain.name : "Departure Train: Pending"}
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Train className="h-3.5 w-3.5 text-gold shrink-0" />
                    <span className="truncate max-w-[180px]">
                      {selectedReturnTrain ? selectedReturnTrain.name : "Return Train: Pending"}
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Bus className="h-3.5 w-3.5 text-gold shrink-0" />
                    <span className="truncate max-w-[180px]">
                      {selectedBus ? selectedBus.name : "Bus Option: Pending"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Selected Accommodation Section */}
        {viewMode === "bookings" && (
          <section className="mt-10 avoid-break no-print">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-gold uppercase">
                Accommodation
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-white">
                Trip Hotel Details
              </h2>
            </div>
            <Hotel className="h-7 w-7 text-gold" />
          </div>

          {selectedHotel ? (
            <div className="gold-border overflow-hidden rounded-xl bg-card">
              <div className="flex flex-col md:flex-row">
                <div className="relative h-48 w-full md:h-auto md:w-80 shrink-0 bg-black/20 print:hidden">
                  <img
                    src={selectedHotel.image}
                    alt={selectedHotel.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-md bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-md border border-white/10">
                      {selectedHotel.vibe}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 justify-between">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-500/20 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Selected Stay
                          </span>
                        </div>
                        <h3 className="mt-2 text-xl font-bold text-white">
                          {selectedHotel.name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-gold" />
                          {selectedHotel.city}, India
                        </p>
                      </div>

                      <div className="flex items-center gap-1 rounded bg-black/30 px-2 py-1 text-xs text-gold">
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        <span className="font-semibold">{selectedHotel.rating}</span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                      <div className="rounded bg-black/25 p-3">
                        <span className="text-muted-foreground block mb-0.5">Rooms Reserved</span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5 text-gold" />
                          {selectedHotel.rooms} Room{selectedHotel.rooms > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="rounded bg-black/25 p-3">
                        <span className="text-muted-foreground block mb-0.5">Duration</span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-gold" />
                          {selectedHotel.nights} Night{selectedHotel.nights > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="rounded bg-black/25 p-3">
                        <span className="text-muted-foreground block mb-0.5">Guests</span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-gold" />
                          {selectedHotel.guests} Traveler{selectedHotel.guests > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="rounded bg-black/25 p-3 font-semibold">
                        <span className="text-muted-foreground block mb-0.5 font-normal">Price per Room</span>
                        <span className="text-white">
                          ₹{selectedHotel.pricePerRoomPerNight.toLocaleString("en-IN")} / night
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/5 pt-4">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Total Bill (with 18% GST):</span>
                      <p className="text-lg font-bold text-gold">
                        ₹{selectedHotel.grandTotal.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Link href="/hotels" className="no-print">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-white hover:bg-white/5 hover:text-white"
                      >
                        Change Accommodation <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="gold-border rounded-xl bg-card/60 p-8 text-center avoid-break">
              <Hotel className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-base font-semibold text-white">No Hotel Selected</h3>
              <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
                Complete your travel itinerary by selecting from the best stays in {trip.destination} matching your budget of {formatFare(trip.budget)} and party of {trip.travelers} travelers.
              </p>
              <Link href="/hotels" className="mt-5 inline-block no-print">
                <Button className="bg-gold font-semibold text-black hover:bg-gold-light">
                  Find Best Hotels <Plus className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </section>
        )}

        {/* Selected choices details for PRINT ONLY */}
        <section className="hidden print:block mt-8 avoid-break">
          <div className="border border-gold/30 rounded-xl p-5 bg-white">
            <h2 className="text-sm font-bold tracking-[0.2em] text-gold uppercase border-b border-gold/25 pb-2 mb-4">
              CONFIRMED TRAVEL DETAILS
            </h2>
            <div className="space-y-4">
              {/* Hotel */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <p className="font-bold text-sm text-black">Hotel Accommodation</p>
                  {selectedHotel ? (
                    <>
                      <p className="text-xs text-gray-700 mt-0.5">{selectedHotel.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {selectedHotel.rooms} Room(s) · {selectedHotel.nights} Night(s) · {selectedHotel.guests} Traveler(s)
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-0.5">No hotel selected</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-black">
                    {selectedHotel ? formatFare(selectedHotel.grandTotal) : "—"}
                  </span>
                </div>
              </div>

              {/* Departure Train */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <p className="font-bold text-sm text-black">Departure Train</p>
                  {selectedTrain ? (
                    <>
                      <p className="text-xs text-gray-700 mt-0.5">{selectedTrain.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {selectedTrain.comfort} · {selectedTrain.duration}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-0.5">No train selected</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-black">
                    {selectedTrain ? formatFare(selectedTrain.fare * trip.travelers) : "—"}
                  </span>
                  {selectedTrain && (
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {formatFare(selectedTrain.fare)} x {trip.travelers} Pax
                    </p>
                  )}
                </div>
              </div>

              {/* Return Train */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <p className="font-bold text-sm text-black">Return Train</p>
                  {selectedReturnTrain ? (
                    <>
                      <p className="text-xs text-gray-700 mt-0.5">{selectedReturnTrain.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {selectedReturnTrain.comfort} · {selectedReturnTrain.duration}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-0.5">No train selected</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-black">
                    {selectedReturnTrain ? formatFare(selectedReturnTrain.fare * trip.travelers) : "—"}
                  </span>
                  {selectedReturnTrain && (
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {formatFare(selectedReturnTrain.fare)} x {trip.travelers} Pax
                    </p>
                  )}
                </div>
              </div>

              {/* Bus */}
              <div className="flex justify-between items-start pb-1">
                <div>
                  <p className="font-bold text-sm text-black">Bus Option</p>
                  {selectedBus ? (
                    <>
                      <p className="text-xs text-gray-700 mt-0.5">{selectedBus.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {selectedBus.comfort} · {selectedBus.duration}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-0.5">No bus option selected</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-black">
                    {selectedBus ? formatFare(selectedBus.fare * trip.travelers) : "—"}
                  </span>
                  {selectedBus && (
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {formatFare(selectedBus.fare)} x {trip.travelers} Pax
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Print Total summary */}
            <div className="mt-4 border-t border-gold/20 pt-4 flex justify-between items-center text-sm">
              <span className="font-bold text-gray-700">Total Booked Expenses:</span>
              <span className="font-extrabold text-gold text-base">{formatFare(prices.totalSelected)}</span>
            </div>
          </div>
        </section>

        {/* TRANSPORT SELECTION SECTIONS (Screen view, tabbed layout) */}
        {viewMode === "bookings" && (
          <section className="mt-10 border border-white/5 bg-charcoal-light/30 rounded-2xl p-6 shadow-xl no-print avoid-break">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-gold uppercase">
                Transport Choices
              </p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-white">
                Select Your Commute
              </h2>
            </div>
            
            {/* Tab switch buttons */}
            <div className="flex bg-black/50 p-1 rounded-xl border border-white/5 self-start md:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab("train")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeTab === "train"
                    ? "bg-gold text-black shadow-md font-bold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Train className="h-3.5 w-3.5" />
                Departure Trains
                {selectedTrain && <Check className="h-3 w-3" />}
              </button>
              <button
                onClick={() => setActiveTab("returnTrain")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeTab === "returnTrain"
                    ? "bg-gold text-black shadow-md font-bold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Train className="h-3.5 w-3.5 rotate-180" />
                Return Trains
                {selectedReturnTrain && <Check className="h-3 w-3" />}
              </button>
              <button
                onClick={() => setActiveTab("bus")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeTab === "bus"
                    ? "bg-gold text-black shadow-md font-bold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Bus className="h-3.5 w-3.5" />
                Buses / Road
                {selectedBus && <Check className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {activeTransport.options.map((option) => {
              const isSelected = activeTransport.selectedName === option.name;
              const Icon = activeTransport.icon;
              return (
                <article
                  key={option.rank}
                  className={`rounded-xl bg-card/65 p-6 border transition-all duration-300 relative hover:-translate-y-0.5 flex flex-col justify-between ${
                    isSelected
                      ? "border-gold bg-gold/[0.03] shadow-lg shadow-gold/5"
                      : "border-white/5 hover:border-white/15 hover:bg-card/90"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                          <Icon className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
                              {option.rank}
                            </span>
                            <p className="text-[10px] font-medium tracking-wider text-gold uppercase font-mono">
                              {option.type}
                            </p>
                          </div>
                          <h3 className="mt-2 text-base font-semibold text-white leading-tight">
                            {option.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground min-h-[48px]">
                      {option.note}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-xs">
                      <div>
                        <p className="flex items-center gap-1 text-muted-foreground font-mono uppercase tracking-wider text-[9px]">
                          <Clock className="h-3 w-3 text-gold" />
                          Time
                        </p>
                        <p className="mt-1.5 font-medium text-white">{option.duration}</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-muted-foreground font-mono uppercase tracking-wider text-[9px]">
                          <IndianRupee className="h-3 w-3 text-gold" />
                          Fare
                        </p>
                        <p className="mt-1.5 font-medium text-white">{formatFare(option.fare)}</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-muted-foreground font-mono uppercase tracking-wider text-[9px]">
                          <Star className="h-3 w-3 text-gold" />
                          Comfort
                        </p>
                        <p className="mt-1.5 font-medium text-white">{option.comfort}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Select/Deselect Button */}
                  <div className="mt-5 border-t border-white/5 pt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Total ({trip.travelers} Pax): <strong className="text-white">{formatFare(option.fare * trip.travelers)}</strong>
                    </span>
                    {isSelected ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectTransport(activeTransport.type, null)}
                        disabled={isPending}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 h-8 text-xs font-semibold px-3"
                      >
                        Deselect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSelectTransport(activeTransport.type, option)}
                        disabled={isPending}
                        className="bg-gold font-semibold text-black hover:bg-gold-light h-8 text-xs px-4"
                      >
                        Select Choice
                      </Button>
                    )}
                  </div>

                  {isSelected && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold text-gold border border-gold/30">
                      <Check className="h-3 w-3" /> Selected
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        )}

        {/* ================= SCREEN SECTION: SPLITME INTERACTIVE ================= */}
        {viewMode === "splitme" && (
          <div className="mt-6 grid gap-8 lg:grid-cols-3 no-print">
            {/* Left Column: Member Management & Add Expense Form */}
            <div className="space-y-6 lg:col-span-1">
              {/* Group Members Card */}
              <div className="gold-border rounded-xl bg-card p-6 shadow-lg">
                <h3 className="text-sm font-bold tracking-[0.2em] text-gold uppercase border-b border-white/5 pb-2 mb-4">
                  Group Members
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Add member name..."
                      className="flex-1 h-9 px-3 rounded bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-gold/50 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddMember();
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddMember}
                      disabled={!newMemberName.trim()}
                      className="bg-gold text-black font-semibold hover:bg-gold-light text-xs h-9 px-3"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>

                  <ul className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1">
                    {members.map((member) => (
                      <li key={member} className="flex justify-between items-center py-2 text-xs">
                        <span className="text-white/90 font-medium">{member}</span>
                        <button
                          onClick={() => handleDeleteMember(member)}
                          className="text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Add Expense Card */}
              <div className="gold-border rounded-xl bg-card p-6 shadow-lg">
                <h3 className="text-sm font-bold tracking-[0.2em] text-gold uppercase border-b border-white/5 pb-2 mb-4">
                  Log Expense
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddExpense();
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-semibold">Description</label>
                    <input
                      type="text"
                      value={newExpDesc}
                      onChange={(e) => setNewExpDesc(e.target.value)}
                      placeholder="e.g. Dinner, Tickets, Taxi"
                      className="w-full h-9 px-3 rounded bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:border-gold/50 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-semibold">Amount (₹)</label>
                    <input
                      type="number"
                      value={newExpAmount}
                      onChange={(e) => setNewExpAmount(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full h-9 px-3 rounded bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:border-gold/50 outline-none"
                      required
                      min="1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-semibold">Paid By</label>
                    <select
                      value={newExpPaidBy}
                      onChange={(e) => setNewExpPaidBy(e.target.value)}
                      className="w-full h-9 px-3 rounded bg-black/40 border border-white/10 text-white focus:border-gold/50 outline-none"
                    >
                      {members.map(m => (
                        <option key={m} value={m} className="bg-neutral-900 text-white">{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-muted-foreground font-semibold block">Split Among</label>
                    <div className="border border-white/10 rounded p-3 bg-black/20 space-y-2 max-h-36 overflow-y-auto">
                      {members.map(m => {
                        const isChecked = newExpSharedBy.includes(m);
                        return (
                          <label key={m} className="flex items-center gap-2 text-white/80 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setNewExpSharedBy(prev => prev.filter(x => x !== m));
                                } else {
                                  setNewExpSharedBy(prev => [...prev, m]);
                                }
                              }}
                              className="h-3.5 w-3.5 rounded border-white/10 bg-black/40 text-gold accent-gold"
                            />
                            <span>{m}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingExpenses || members.length === 0}
                    className="w-full bg-gold text-black font-bold hover:bg-gold-light h-10 mt-2"
                  >
                    {isSavingExpenses ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Add Expense"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Right Column: Settlements, Balances & Expense Log */}
            <div className="lg:col-span-2 space-y-6">
              {/* Balances & Settlement Dashboard */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Net Balances */}
                <div className="gold-border rounded-xl bg-card p-6 shadow-lg">
                  <h3 className="text-sm font-bold tracking-[0.2em] text-gold uppercase border-b border-white/5 pb-2 mb-4">
                    Member Balances
                  </h3>
                  {members.length === 0 ? (
                    <p className="text-muted-foreground text-xs italic">Add group members to start splitting expenses.</p>
                  ) : (
                    <ul className="space-y-3">
                      {members.map(m => {
                        const bal = balances[m] || 0;
                        return (
                          <li key={m} className="flex justify-between items-center text-xs border-b border-white/[0.02] pb-2 last:border-0 last:pb-0">
                            <span className="text-white/90 font-medium">{m}</span>
                            <span className={`font-bold ${bal >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {bal >= 0 ? "+" : ""}{formatFare(bal)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Settlements Settle-Up */}
                <div className="gold-border rounded-xl bg-card p-6 shadow-lg">
                  <h3 className="text-sm font-bold tracking-[0.2em] text-gold uppercase border-b border-white/5 pb-2 mb-4">
                    Debt Settlement Plan
                  </h3>
                  {localExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-xs italic">Log expenses to calculate who owes whom.</p>
                  ) : settlements.length === 0 ? (
                    <p className="text-green-400 text-xs italic font-semibold flex items-center gap-1.5">
                      <Check className="h-4 w-4" /> All expenses are perfectly split!
                    </p>
                  ) : (
                    <ul className="space-y-3 text-xs">
                      {settlements.map((setl, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-black/20 p-2.5 rounded border border-white/5">
                          <span className="text-white/80">
                            <strong className="text-gold font-semibold">{setl.from}</strong> owes <strong className="text-white font-semibold">{setl.to}</strong>
                          </span>
                          <span className="font-bold text-gold">{formatFare(setl.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Logged Expenses List */}
              <div className="gold-border rounded-xl bg-card p-6 shadow-lg">
                <h3 className="text-sm font-bold tracking-[0.2em] text-gold uppercase border-b border-white/5 pb-2 mb-4">
                  Expense Ledger ({localExpenses.length} Logged)
                </h3>
                {localExpenses.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-lg">
                    <IndianRupee className="mx-auto h-8 w-8 text-muted-foreground opacity-30 animate-pulse" />
                    <h4 className="mt-3 text-sm font-bold text-white">No Expenses Logged Yet</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Keep track of your group travel costs here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-muted-foreground">
                          <th className="pb-3 font-semibold">Description</th>
                          <th className="pb-3 text-right font-semibold">Amount</th>
                          <th className="pb-3 text-right font-semibold">Paid By</th>
                          <th className="pb-3 text-right font-semibold">Shared By</th>
                          <th className="pb-3 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {localExpenses.map((exp, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 text-white/95 font-medium">{exp.description}</td>
                            <td className="py-3 text-right text-white font-semibold">{formatFare(exp.amount)}</td>
                            <td className="py-3 text-right text-muted-foreground">{exp.paidBy}</td>
                            <td className="py-3 text-right text-muted-foreground">
                              {exp.sharedBy?.length === members.length ? (
                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5">Everyone</span>
                              ) : (
                                <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded border border-gold/20" title={exp.sharedBy?.join(", ")}>
                                  {exp.sharedBy?.length} Pax
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteExpense(idx)}
                                className="text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete expense"
                                disabled={isSavingExpenses}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= PRINT SECTION 1: TRAINS & BUSES ONLY ================= */}
        <section className="hidden print:block mb-8 avoid-break">
          <div className="border border-gold/30 rounded-xl p-6 bg-white">
            <div className="text-center border-b border-gold/20 pb-4 mb-4">
              <span className="text-[10px] font-bold tracking-[0.3em] text-gold uppercase">BHARAT YATRA TRAVEL GUIDE</span>
              <h2 className="text-xl font-bold text-black mt-1 uppercase">PAGE 1: TRANSPORT & TRAVEL DETAILS</h2>
              <p className="text-xs text-gray-500 mt-1">Confirmed commute reservations from {startLocation} to {trip.destination}</p>
            </div>

            <div className="space-y-6">
              {/* Departure Train */}
              <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-black flex items-center gap-1.5">
                      Departure Train Confirmation
                    </h3>
                    {selectedTrain ? (
                      <div className="mt-2 text-xs text-gray-700 space-y-1">
                        <p className="font-semibold text-black">{selectedTrain.name}</p>
                        <p className="text-gray-500">Service: {selectedTrain.type} · Comfort Class: {selectedTrain.comfort}</p>
                        <p className="text-gray-500">Duration: {selectedTrain.duration} · Estimated fare per traveler: {formatFare(selectedTrain.fare)}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-2">No departure train selected. Please coordinate your departure transit.</p>
                    )}
                  </div>
                  {selectedTrain && (
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-black">Total Transit:</span>
                      <p className="text-sm font-bold text-gold mt-0.5">{formatFare(selectedTrain.fare * trip.travelers)}</p>
                      <p className="text-[9px] text-gray-500">{formatFare(selectedTrain.fare)} x {trip.travelers} Pax</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Return Train */}
              <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-black flex items-center gap-1.5">
                      Return Train Confirmation
                    </h3>
                    {selectedReturnTrain ? (
                      <div className="mt-2 text-xs text-gray-700 space-y-1">
                        <p className="font-semibold text-black">{selectedReturnTrain.name}</p>
                        <p className="text-gray-500">Service: {selectedReturnTrain.type} · Comfort Class: {selectedReturnTrain.comfort}</p>
                        <p className="text-gray-500">Duration: {selectedReturnTrain.duration} · Estimated fare per traveler: {formatFare(selectedReturnTrain.fare)}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-2">No return train selected. Please coordinate your return transit.</p>
                    )}
                  </div>
                  {selectedReturnTrain && (
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-black">Total Transit:</span>
                      <p className="text-sm font-bold text-gold mt-0.5">{formatFare(selectedReturnTrain.fare * trip.travelers)}</p>
                      <p className="text-[9px] text-gray-500">{formatFare(selectedReturnTrain.fare)} x {trip.travelers} Pax</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bus Route */}
              <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-black flex items-center gap-1.5">
                      Local / Road Bus Transit
                    </h3>
                    {selectedBus ? (
                      <div className="mt-2 text-xs text-gray-700 space-y-1">
                        <p className="font-semibold text-black">{selectedBus.name}</p>
                        <p className="text-gray-500">Service: {selectedBus.type} · Seat Comfort: {selectedBus.comfort}</p>
                        <p className="text-gray-500">Duration: {selectedBus.duration} · Estimated fare per traveler: {formatFare(selectedBus.fare)}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-2">No bus service selected for local/road transit.</p>
                    )}
                  </div>
                  {selectedBus && (
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-black">Total transit:</span>
                      <p className="text-sm font-bold text-gold mt-0.5">{formatFare(selectedBus.fare * trip.travelers)}</p>
                      <p className="text-[9px] text-gray-500">{formatFare(selectedBus.fare)} x {trip.travelers} Pax</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gold/20 pt-4 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-600">Aggregate Commuting Costs:</span>
              <span className="font-bold text-black text-sm">
                {formatFare(
                  (selectedTrain ? selectedTrain.fare * trip.travelers : 0) +
                  (selectedReturnTrain ? selectedReturnTrain.fare * trip.travelers : 0) +
                  (selectedBus ? selectedBus.fare * trip.travelers : 0)
                )}
              </span>
            </div>
          </div>
        </section>

        {/* ================= PRINT SECTION 2: HOTELS ONLY ================= */}
        <section className="hidden print:block mb-8 avoid-break page-break">
          <div className="border border-gold/30 rounded-xl p-6 bg-white">
            <div className="text-center border-b border-gold/20 pb-4 mb-4">
              <span className="text-[10px] font-bold tracking-[0.3em] text-gold uppercase font-mono">BHARAT YATRA TRAVEL GUIDE</span>
              <h2 className="text-xl font-bold text-black mt-1 uppercase">PAGE 2: ACCOMMODATION VOUCHER</h2>
              <p className="text-xs text-gray-500 mt-1">Confirmed lodging reservation details in {trip.destination}</p>
            </div>

            {selectedHotel ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-700 border border-green-500/20">
                      Lodging Reservation Confirmed
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-black">{selectedHotel.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-gold" />
                      {selectedHotel.city}, India
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gold font-bold">
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    <span>{selectedHotel.rating} / 5</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="rounded border border-gray-100 p-3 bg-gray-50/50">
                    <span className="text-gray-500 block mb-0.5">Lodging Capacity</span>
                    <span className="font-bold text-black">{selectedHotel.rooms} Room(s) for {selectedHotel.guests} Guest(s)</span>
                  </div>
                  <div className="rounded border border-gray-100 p-3 bg-gray-50/50">
                    <span className="text-gray-500 block mb-0.5">Duration</span>
                    <span className="font-bold text-black">{selectedHotel.nights} Night(s)</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base Room Rate:</span>
                    <span className="text-gray-800">{formatFare(selectedHotel.pricePerRoomPerNight)} / room / night</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base Subtotal:</span>
                    <span className="text-gray-800">{formatFare(selectedHotel.baseTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taxes & GST (18%):</span>
                    <span className="text-gray-800">{formatFare(selectedHotel.gst)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold">
                    <span className="text-black">Lodging Grand Total:</span>
                    <span className="text-gold">{formatFare(selectedHotel.grandTotal)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-gray-200 rounded-lg">
                <Hotel className="mx-auto h-8 w-8 text-gray-300" />
                <h3 className="mt-3 text-sm font-bold text-black">No Hotel Selected</h3>
                <p className="mt-1 text-xs text-gray-500">Lodging arrangements have not been selected for this trip.</p>
              </div>
            )}
          </div>
        </section>

        {/* ================= AI PLAN LOADER (SCREEN VIEW ONLY) ================= */}
        {viewMode === "itinerary" && isGeneratingAll && (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl bg-card p-12 text-center border border-white/5 no-print">
            <Loader2 className="h-10 w-10 animate-spin text-gold mb-4" />
            <h3 className="text-lg font-bold text-white">Generating Your AI Travel Plan...</h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-md">
              We are using Google Gemini to construct a fully personalized daily plan for {trip.destination}. This includes local hotspots, restaurants, and specific cultural activities. Please wait a moment.
            </p>
          </div>
        )}

        {/* ================= SCREEN VIEW DAY CARDS GRID (SCREEN ONLY) ================= */}
        {viewMode === "itinerary" && itinerary.days && itinerary.days.length > 0 && !isGeneratingAll && (
          <div className="mt-6 space-y-6 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] text-gold uppercase">
                  Daily Outline
                </p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-white">
                  Day-by-Day Plan
                </h2>
              </div>
              <div className="text-xs text-muted-foreground italic">
                Click any day to view detailed activities, custom maps, and refine with AI!
              </div>
            </div>

            {/* Grid of Day Cards */}
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {itinerary.days.map((day) => (
                <div
                  key={day.day}
                  onClick={() => setSelectedDayNumber(day.day)}
                  className="group rounded-xl bg-card/65 p-5 border border-white/5 hover:border-gold/40 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-15 transition-opacity">
                    <CalendarDays className="h-16 w-16 text-gold" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                      <span className="text-xs font-mono font-bold text-gold tracking-wide uppercase">Day {day.day}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">Est. {formatFare(day.estimatedCost)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-gold transition-colors line-clamp-2 pr-4">
                      {day.title}
                    </h3>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 text-[11px] text-muted-foreground flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-gold" />
                      View daily plan & map
                    </span>
                    <span className="font-semibold text-white/70">{day.activities?.length || 0} activities</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= INTERACTIVE DETAILED POPUP MODAL (SCREEN ONLY) ================= */}
        <AnimatePresence>
          {viewMode === "itinerary" && selectedDayNumber !== null && (() => {
            const day = itinerary.days?.find(d => d.day === selectedDayNumber);
            if (!day) return null;
            
            const dayPrompt = aiPrompts[day.day] || "";
            const isRefining = refiningDays[day.day] || false;
            const newActText = newActivityTexts[day.day] || "";

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print"
                onClick={() => setSelectedDayNumber(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-neutral-900 border border-gold/30 p-6 md:p-8 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedDayNumber(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-muted-foreground hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Header */}
                  <div className="border-b border-white/5 pb-4 mb-6 pr-10">
                    <span className="text-xs font-mono font-bold text-gold uppercase tracking-widest">
                      Day {day.day} Itinerary
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
                      {day.title}
                    </h3>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Panel: Checklist and AI Adjuster */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                          Daily Activities Checklist
                        </h4>
                        <ul className="space-y-3">
                          {day.activities.map((activity, index) => {
                            const text = getActivityText(activity);
                            const completed = isActivityCompleted(activity);
                            return (
                              <li
                                key={index}
                                className="group flex items-start justify-between gap-2.5 rounded-lg bg-black/30 p-2.5 border border-white/5 hover:border-white/10 transition-colors"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={completed}
                                    onChange={() => handleToggleActivity(day.day, index)}
                                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/10 bg-black/40 text-gold accent-gold cursor-pointer"
                                  />
                                  <span
                                    onClick={() => handleToggleActivity(day.day, index)}
                                    className={`text-xs leading-relaxed transition-all cursor-pointer ${
                                      completed
                                        ? "line-through text-muted-foreground/60 italic"
                                        : "text-white/85"
                                    }`}
                                  >
                                    {text}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeleteActivity(day.day, index)}
                                  className="text-muted-foreground hover:text-red-400 transition-all cursor-pointer"
                                  title="Delete task"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Manual Activity Adder */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newActText}
                          onChange={(e) => setNewActivityTexts(prev => ({ ...prev, [day.day]: e.target.value }))}
                          placeholder="Add custom activity..."
                          className="flex-1 h-9 px-3 rounded bg-black/50 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-gold/50 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddActivity(day.day);
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddActivity(day.day)}
                          disabled={!newActText.trim()}
                          className="h-9 w-9 p-0 bg-gold/10 hover:bg-gold text-gold hover:text-black border border-gold/20 shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* AI Adjuster Box */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Ask AI to Refine Day {day.day} Plan
                        </h4>
                        <div className="flex items-center gap-2 bg-gold/[0.02] border border-gold/10 rounded p-2">
                          <input
                            type="text"
                            value={dayPrompt}
                            onChange={(e) => setAiPrompts(prev => ({ ...prev, [day.day]: e.target.value }))}
                            placeholder="e.g. recommend a better restaurant..."
                            className="flex-1 h-9 px-3 rounded bg-black/50 border border-white/10 text-xs text-white placeholder:text-gold/25 focus:border-gold/30 outline-none"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAiRefine(day.day);
                            }}
                            disabled={isRefining}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAiRefine(day.day)}
                            disabled={!dayPrompt.trim() || isRefining}
                            className="h-9 px-3 bg-gold font-semibold text-black hover:bg-gold-light text-xs transition-all flex items-center gap-1.5 shrink-0"
                          >
                            {isRefining ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            <span>Adjust</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Recommendations & Interactive Map */}
                    <div className="space-y-4">
                      {/* Place & Food suggestions */}
                      <div className="rounded-xl bg-gold/5 border border-gold/15 p-4 space-y-3 text-xs">
                        {day.bestPlace && (
                          <div className="flex items-start gap-2.5">
                            <MapPin className="h-4.5 w-4.5 text-gold shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                              <span className="font-bold text-white/95 block mb-0.5">Best Place to Visit:</span>
                              <span className="text-muted-foreground">{day.bestPlace}</span>
                            </div>
                          </div>
                        )}
                        {day.bestFood && (
                          <div className="flex items-start gap-2.5 pt-2.5 border-t border-gold/10">
                            <Sparkles className="h-4.5 w-4.5 text-gold shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                              <span className="font-bold text-white/95 block mb-0.5">Must-Try Local Food:</span>
                              <span className="text-muted-foreground">{day.bestFood}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interactive Map */}
                      {day.bestPlace && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Interactive Location Map
                          </h4>
                          <LeafletMap placeName={day.bestPlace} destination={trip.destination} />
                        </div>
                      )}

                      <div className="pt-2 text-[10px] text-muted-foreground flex justify-between items-center border-t border-white/5">
                        <span>Daily Budget Estimated Cost:</span>
                        <span className="text-white/85 font-bold">{formatFare(day.estimatedCost)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* ================= PRINT-ONLY DETAIL CHECKLIST GUIDE ================= */}
        {itinerary.days && itinerary.days.length > 0 && (
          <section className="hidden print:block page-break mt-12">
            <div className="mb-6 border-b border-gold/30 pb-4">
              <span className="text-[10px] font-bold tracking-[0.3em] text-gold uppercase">BHARAT YATRA TRAVEL GUIDE</span>
              <h2 className="text-xl font-bold text-black mt-1 uppercase">PAGE 3: DAILY ITINERARY</h2>
              <p className="text-xs text-gray-500 mt-1">Detailed day-by-day sightseeing and activities checklist</p>
            </div>

            <div className="grid gap-6 grid-cols-2">
              {itinerary.days.map((day) => (
                <article
                  key={day.day}
                  className="rounded-xl border border-gray-200 p-5 bg-white flex flex-col justify-between avoid-break"
                >
                  <div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                      <span className="text-xs font-bold text-gold">DAY {day.day}</span>
                      <span className="text-xs font-bold text-black">{day.title}</span>
                    </div>

                    {/* AI Recommendations */}
                    {(day.bestPlace || day.bestFood) && (
                      <div className="mb-3 rounded bg-gray-50 border border-gray-100 p-2.5 space-y-1.5 text-xs text-gray-700">
                        {day.bestPlace && (
                          <p><strong>Best Place to Visit:</strong> {day.bestPlace}</p>
                        )}
                        {day.bestFood && (
                          <p><strong>Must-Try Food:</strong> {day.bestFood}</p>
                        )}
                      </div>
                    )}

                    {/* Activities */}
                    <ul className="space-y-2 text-xs text-gray-600">
                      {day.activities.map((activity, index) => {
                        const text = getActivityText(activity);
                        const completed = isActivityCompleted(activity);
                        return (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-0.5 border border-gray-400 rounded-sm h-3.5 w-3.5 shrink-0 flex items-center justify-center text-[9px] font-bold">
                              {completed ? "✓" : " "}
                            </span>
                            <span className={completed ? "line-through text-gray-400 italic" : "text-gray-700"}>
                              {text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-2 text-[10px] text-gray-500 flex justify-between items-center">
                    <span>Daily Est. Cost:</span>
                    <span className="font-bold text-black">{formatFare(day.estimatedCost)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ================= PRINT SECTION 4: SPLITME EXPENSES ================= */}
        {localExpenses.length > 0 && (
          <section className="hidden print:block mb-8 avoid-break page-break">
            <div className="border border-gold/30 rounded-xl p-6 bg-white">
              <div className="text-center border-b border-gold/20 pb-4 mb-4">
                <span className="text-[10px] font-bold tracking-[0.3em] text-gold uppercase font-mono">BHARAT YATRA TRAVEL GUIDE</span>
                <h2 className="text-xl font-bold text-black mt-1 uppercase">PAGE 4: GROUP EXPENSE STATEMENT (SPLITME)</h2>
                <p className="text-xs text-gray-500 mt-1">Calculated group balances and settlement plan</p>
              </div>

              {/* Balances list */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                {members.map(member => {
                  const bal = balances[member] || 0;
                  return (
                    <div key={member} className="rounded border border-gray-100 p-3 bg-gray-50/50 flex justify-between">
                      <span className="font-bold text-gray-700">{member}</span>
                      <span className={`font-bold ${bal >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {bal >= 0 ? "+" : ""}{formatFare(bal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Settlement list */}
              <div className="border-t border-gray-100 pt-4 mb-6">
                <h3 className="text-sm font-bold text-black mb-3">Settlement Plan</h3>
                {settlements.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {settlements.map((setl, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">
                          <strong className="text-black">{setl.from}</strong> owes <strong className="text-black">{setl.to}</strong>
                        </span>
                        <span className="font-bold text-gold">{formatFare(setl.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic">No payments needed. All expenses are settled!</p>
                )}
              </div>

              {/* Expense Log list */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-black mb-3">Logged Expenses Ledger</h3>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-right">Paid By</th>
                      <th className="pb-2 text-right">Split</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localExpenses.map((exp, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 text-gray-800">{exp.description}</td>
                        <td className="py-2 text-right text-gray-800">{formatFare(exp.amount)}</td>
                        <td className="py-2 text-right text-gray-800">{exp.paidBy}</td>
                        <td className="py-2 text-right text-gray-500">{exp.sharedBy?.length === members.length ? "Equally" : `${exp.sharedBy?.length} pax`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-6 z-50 no-print max-w-sm w-full"
          >
            <div className={`gold-border flex items-center justify-between gap-3 rounded-xl bg-charcoal-light/95 p-4 shadow-2xl border ${
              notification.type === "success" ? "border-gold/50" : "border-white/10"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gold/10">
                  <Check className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-gold uppercase">
                    {notification.type === "success" ? "Selection Updated" : "Choice Cleared"}
                  </p>
                  <p className="text-sm text-white/90 font-medium mt-0.5">
                    {notification.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-muted-foreground hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
