"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SectionHeader } from "./section-header";
import { budgetBreakdown, foods } from "@/lib/data";

const total = budgetBreakdown.reduce((sum, item) => sum + item.amount, 0);

function DonutChart() {
  const segments = budgetBreakdown.reduce<
    Array<(typeof budgetBreakdown)[number] & { percentage: number; start: number }>
  >((acc, item) => {
    const percentage = (item.amount / total) * 100;
    const start = acc.length
      ? acc[acc.length - 1].start + acc[acc.length - 1].percentage
      : 0;
    acc.push({ ...item, percentage, start });
    return acc;
  }, []);

  const gradientStops = segments
    .map((s) => `${s.color} ${s.start}% ${s.start + s.percentage}%`)
    .join(", ");

  return (
    <div className="relative mx-auto h-44 w-44 shrink-0">
      <div
        className="h-full w-full rounded-full"
        style={{
          background: `conic-gradient(${gradientStops})`,
        }}
      />
      <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-card">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-xl font-bold text-gold">
          ₹{total.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

export function BudgetFood() {
  return (
    <section id="budget" className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Budget Planner */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="gold-border rounded-2xl bg-card p-6 sm:p-8"
          >
            <SectionHeader
              title="BUDGET PLANNER"
              highlight="(JAIPUR — 3 DAYS)"
            />

            <div className="flex flex-col items-center gap-8 sm:flex-row">
              <DonutChart />

              <div className="w-full flex-1 space-y-4">
                {budgetBreakdown.map((item) => {
                  const pct = Math.round((item.amount / total) * 100);
                  return (
                    <div key={item.category}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-white/80">{item.category}</span>
                        <span className="font-medium text-white">
                          ₹{item.amount.toLocaleString("en-IN")}{" "}
                          <span className="text-muted-foreground">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {budgetBreakdown.map((item) => (
                <div
                  key={item.category}
                  className="rounded-lg bg-secondary/60 p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  <p className="mt-1 font-semibold text-gold">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Food Discovery */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="gold-border rounded-2xl bg-card p-6 sm:p-8"
          >
            <SectionHeader
              title="DISCOVER INDIA"
              highlight="THROUGH FOOD"
              subtitle="Authentic regional cuisines curated for every destination."
            />

            <div className="hide-scrollbar -mx-2 flex gap-5 overflow-x-auto px-2 pb-3">
              {foods.map((food, i) => (
                <motion.div
                  key={food.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="w-[120px] shrink-0 text-center sm:w-[130px]"
                >
                  <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full ring-2 ring-gold/20 sm:h-28 sm:w-28">
                    <Image
                      src={food.image}
                      alt={food.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <h4 className="mt-3 text-sm font-medium text-white">
                    {food.name}
                  </h4>
                  <p className="text-xs text-gold">{food.region}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
