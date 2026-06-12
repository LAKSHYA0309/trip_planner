"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { SectionHeader } from "./section-header";
import { destinations } from "@/lib/data";

export function PopularDestinations() {
  return (
    <section id="destinations" className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="POPULAR DESTINATIONS"
          highlight="IN INDIA"
          action={
            <Link
              href="#"
              className="flex items-center gap-1 text-sm text-gold transition-colors hover:text-gold-light"
            >
              View all destinations
              <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="hide-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-3 sm:gap-6">
          {destinations.map((dest, i) => (
            <motion.article
              key={dest.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group w-[200px] shrink-0 sm:w-[220px] lg:w-[240px]"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="240px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 p-4">
                  <h3 className="text-lg font-semibold text-white">{dest.name}</h3>
                  <p className="mt-1 text-sm font-medium text-gold">
                    From ₹{dest.budget}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    {dest.duration} · {dest.season}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
