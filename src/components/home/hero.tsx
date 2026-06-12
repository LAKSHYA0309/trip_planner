"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Wallet,
  BadgeCheck,
  Utensils,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trustIndicators } from "@/lib/data";

const iconMap = {
  wallet: Wallet,
  "badge-check": BadgeCheck,
  utensils: Utensils,
  route: Route,
};

export function Hero() {
  return (
    <section className="relative min-h-screen">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1920&q=85"
          alt="Ladakh monastery in the Himalayas"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pt-28 pb-40 sm:px-6 sm:pt-32 sm:pb-48 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <p className="mb-4 text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            AI-Powered India Travel
          </p>
          <h1 className="font-heading text-4xl leading-[1.1] font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            PLAN YOUR PERFECT{" "}
            <span className="text-gradient-gold">INDIA</span> TRIP
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Generate personalized itineraries, discover hotels, restaurants,
            attractions, local experiences, and optimize your trip budget using
            AI.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 sm:gap-4">
            <Button
              size="lg"
              className="bg-gold px-8 font-semibold text-black hover:bg-gold-light"
            >
              Plan My Trip
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gold/40 bg-transparent px-8 text-gold hover:bg-gold/10 hover:text-gold-light"
            >
              Explore Destinations
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-16 grid grid-cols-2 gap-5 border-t border-white/10 pt-10 sm:grid-cols-4 sm:gap-7"
        >
          {trustIndicators.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/20">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <span className="text-xs font-medium text-white/80 sm:text-sm">
                  {item.label}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
