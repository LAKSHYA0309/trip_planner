"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Building2,
  Users,
  Star,
  Mountain,
  Waves,
  Landmark,
  TreePine,
} from "lucide-react";
import { SectionHeader } from "./section-header";
import { mapRegions, exploreCategories, stats } from "@/lib/data";

const statIcons = {
  "map-pin": MapPin,
  "building-2": Building2,
  users: Users,
  star: Star,
};

import type { LucideIcon } from "lucide-react";

const categoryIcons: Record<string, LucideIcon | (() => React.ReactNode)> = {
  mountain: Mountain,
  waves: Waves,
  landmark: Landmark,
  om: () => (
    <span className="text-sm font-semibold text-gold">ॐ</span>
  ),
  "tree-pine": TreePine,
};

function IndiaMap() {
  return (
    <div className="relative aspect-square w-full max-w-sm">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        aria-label="Map of India"
      >
        <defs>
          <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a2218" />
            <stop offset="100%" stopColor="#1a1510" />
          </linearGradient>
        </defs>
        <path
          d="M 35 8 C 38 6, 42 8, 44 12 C 46 10, 50 12, 52 16 C 55 14, 58 18, 56 22 C 60 24, 62 28, 60 32 C 64 34, 66 38, 64 42 C 68 44, 70 48, 68 52 C 72 56, 74 60, 72 64 C 76 68, 78 72, 74 76 C 70 80, 64 82, 58 84 C 52 86, 46 84, 42 80 C 38 76, 34 72, 32 66 C 28 62, 26 56, 28 50 C 26 44, 28 38, 30 32 C 28 26, 30 20, 32 16 C 33 12, 34 10, 35 8 Z"
          fill="url(#mapGrad)"
          stroke="rgba(201,162,39,0.3)"
          strokeWidth="0.5"
        />
        <path
          d="M 68 30 C 72 28, 78 30, 82 34 C 86 38, 88 44, 86 50 C 84 56, 78 58, 74 54 C 70 50, 68 44, 70 38 C 68 34, 68 32, 68 30 Z"
          fill="url(#mapGrad)"
          stroke="rgba(201,162,39,0.3)"
          strokeWidth="0.5"
        />
        <path
          d="M 78 52 C 82 50, 88 52, 90 58 C 88 64, 82 66, 78 62 C 74 58, 76 54, 78 52 Z"
          fill="url(#mapGrad)"
          stroke="rgba(201,162,39,0.3)"
          strokeWidth="0.5"
        />
        {mapRegions.map((region) => (
          <g key={region.name}>
            <circle
              cx={region.x}
              cy={region.y}
              r="2.5"
              fill="#c9a227"
              className="animate-pulse"
            />
            <circle
              cx={region.x}
              cy={region.y}
              r="4"
              fill="none"
              stroke="#c9a227"
              strokeWidth="0.3"
              opacity="0.5"
            />
          </g>
        ))}
      </svg>
      <div className="absolute right-0 bottom-0 left-0 flex flex-wrap justify-center gap-2">
        {mapRegions.slice(0, 4).map((r) => (
          <span
            key={r.name}
            className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-gold ring-1 ring-gold/20"
          >
            {r.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ExploreStats() {
  return (
    <section className="border-y border-white/5 bg-charcoal px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Explore India */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <SectionHeader
              title="EXPLORE"
              highlight="INDIA"
              subtitle="From the Himalayas to the backwaters, discover every corner of incredible India."
            />

            <div className="flex flex-col items-center gap-10 sm:flex-row">
              <IndiaMap />
              <div className="grid w-full grid-cols-2 gap-4 sm:max-w-xs">
                {exploreCategories.map((cat) => {
                  const Icon = categoryIcons[cat.icon];
                  return (
                    <div
                      key={cat.label}
                      className="flex items-center gap-3 rounded-lg bg-card p-3 ring-1 ring-white/5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold/10">
                        {cat.icon === "om" ? (
                          <span className="text-sm font-semibold text-gold">ॐ</span>
                        ) : (
                          <Icon className="h-4 w-4 text-gold" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-white/90">
                        {cat.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <SectionHeader title="TRUSTED BY" highlight="TRAVELERS" />

            <div className="grid grid-cols-2 gap-5">
              {stats.map((stat, i) => {
                const Icon = statIcons[stat.icon as keyof typeof statIcons];
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="gold-border rounded-xl bg-card p-5 text-center"
                  >
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <p className="font-heading text-2xl font-bold text-gold sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      {stat.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
