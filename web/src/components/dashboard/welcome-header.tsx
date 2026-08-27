"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CalendarDays, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/types";

interface WelcomeHeaderProps {
  user: SessionUser;
}

export function WelcomeHeader({ user }: WelcomeHeaderProps) {
  const reduceMotion = useReducedMotion();
  const today = new Intl.DateTimeFormat("ar-SD", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative mb-6 overflow-hidden rounded-3xl bg-[#0b2c3b] px-5 py-6 text-white shadow-xl shadow-slate-900/10 sm:px-7 sm:py-7"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(52,211,190,0.2),transparent_35%),radial-gradient(circle_at_85%_100%,rgba(213,168,79,0.14),transparent_34%)]" />
      <div className="soft-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold text-teal-100">
            <Sparkles className="h-3.5 w-3.5" /> مركز قيادة العمليات
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">مرحبًا {user.name}، كل شيء تحت السيطرة.</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-white/60">تابع أداء الحجوزات والرحلات والإيرادات من مكان واحد، واتخذ قرارات أسرع ببيانات محدثة.</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/50"><CalendarDays className="h-4 w-4 text-[#62d6c8]" />{today}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="border-0 bg-[#31c7b5] text-[#062b2a] shadow-lg shadow-black/15 hover:bg-[#49d3c2]">
            <Link href="/bookings"><Plus /> حجز جديد</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/15 bg-white/[0.06] text-white hover:border-white/25 hover:bg-white/10 hover:text-white">
            <Link href="/trips">إدارة الرحلات <ArrowLeft /></Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
