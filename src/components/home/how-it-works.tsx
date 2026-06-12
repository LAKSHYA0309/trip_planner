"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  Sparkles,
  IndianRupee,
} from "lucide-react";
import { SectionHeader } from "./section-header";
import { howItWorks } from "@/lib/data";

const iconMap = {
  "clipboard-list": ClipboardList,
  sparkles: Sparkles,
  "indian-rupee": IndianRupee,
};

export function HowItWorks() {
  return (
    <section className="border-y border-white/5 bg-charcoal px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader title="HOW IT WORKS" />

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          <div className="absolute top-12 right-[16.67%] left-[16.67%] hidden h-px border-t border-dashed border-gold/30 md:block" />

          {howItWorks.map((step, i) => {
            const Icon = iconMap[step.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 ring-2 ring-gold/30">
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-black">
                    {step.step}
                  </span>
                  <Icon className="h-7 w-7 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
