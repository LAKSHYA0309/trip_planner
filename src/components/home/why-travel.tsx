"use client";

import { motion } from "framer-motion";
import {
  Brain,
  PieChart,
  Building,
  ChefHat,
  Map,
  FileDown,
} from "lucide-react";
import { SectionHeader } from "./section-header";
import { features } from "@/lib/data";

const iconMap = {
  brain: Brain,
  "pie-chart": PieChart,
  building: Building,
  "chef-hat": ChefHat,
  map: Map,
  "file-down": FileDown,
};

export function WhyTravel() {
  return (
    <section id="experiences" className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="WHY TRAVEL"
          highlight="WITH US"
          subtitle="Everything you need for an unforgettable Indian journey, powered by AI."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {features.map((feature, i) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="gold-border group rounded-xl bg-card p-6 transition-colors hover:bg-secondary/50"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20 transition-colors group-hover:bg-gold/15">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
