"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "./section-header";
import { itineraries } from "@/lib/data";

export function PopularItineraries() {
  return (
    <section id="itineraries" className="border-t border-white/5 bg-charcoal px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="POPULAR"
          highlight="ITINERARIES"
          action={
            <Link
              href="#"
              className="flex items-center gap-1 text-sm text-gold transition-colors hover:text-gold-light"
            >
              View all itineraries
              <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="grid gap-7 sm:grid-cols-2 lg:gap-8">
          {itineraries.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group gold-border overflow-hidden rounded-2xl bg-card"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className="absolute top-4 left-4 bg-gold font-semibold text-black hover:bg-gold">
                  {item.days} DAYS
                </Badge>
                <button
                  type="button"
                  aria-label="Save itinerary"
                  className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 transition-colors hover:bg-black/70 hover:text-gold"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-white/10 text-xs text-muted-foreground"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-gold text-gold" />
                    <span className="font-medium text-white">{item.rating}</span>
                    <span className="text-muted-foreground">
                      ({item.reviews})
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Top Attractions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded-md bg-secondary px-2.5 py-1 text-xs text-white/80"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-sm text-muted-foreground">
                    Per person
                  </span>
                  <span className="text-lg font-semibold text-gold">
                    ₹{item.budget}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
