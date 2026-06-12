"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1920&q=85"
          alt="Amber Fort at sunset, Rajasthan"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            READY FOR YOUR NEXT{" "}
            <span className="text-gradient-gold">ADVENTURE?</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
            Join thousands of travelers who have discovered the magic of India
            with AI-powered trip planning.
          </p>
          <Button
            size="lg"
            className="mt-10 bg-gold px-10 font-semibold tracking-wide text-black hover:bg-gold-light"
          >
            PLAN MY INDIA TRIP
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
