"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/types/dashboard";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  period?: string;
  icon: LucideIcon;
  trend?: TrendDirection;
  delay?: number;
  accent?: "teal" | "blue" | "amber" | "violet";
}

const trendConfig: Record<TrendDirection, { icon: LucideIcon; className: string }> = {
  up: { icon: TrendingUp, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  down: { icon: TrendingDown, className: "bg-rose-500/10 text-rose-600 dark:text-rose-300" },
  neutral: { icon: Minus, className: "bg-muted text-muted-foreground" },
};

const accentConfig = {
  teal: "bg-teal-500/10 text-teal-700 ring-teal-500/10 dark:text-teal-300",
  blue: "bg-blue-500/10 text-blue-700 ring-blue-500/10 dark:text-blue-300",
  amber: "bg-amber-500/10 text-amber-700 ring-amber-500/10 dark:text-amber-300",
  violet: "bg-violet-500/10 text-violet-700 ring-violet-500/10 dark:text-violet-300",
};

export function StatsCard({ title, value, change, period, icon: Icon, trend = "neutral", delay = 0, accent = "teal" }: StatsCardProps) {
  const TrendIcon = trendConfig[trend].icon;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay }} className="h-full">
      <Card className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-slate-900/[0.06]">
        <CardContent className="p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{title}</p>
              <p className="mt-2 font-display text-[1.7rem] font-bold tracking-tight text-foreground">{value}</p>
            </div>
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl ring-4 transition-transform group-hover:scale-105", accentConfig[accent])}><Icon className="h-5 w-5" /></div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {change ? <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold", trendConfig[trend].className)}><TrendIcon className="h-3 w-3" />{change}</span> : <span className="inline-flex h-6 items-center rounded-full bg-muted px-2 text-muted-foreground">مستقر</span>}
            {period ? <span className="text-muted-foreground">{period}</span> : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
