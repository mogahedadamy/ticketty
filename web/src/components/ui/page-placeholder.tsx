import Link from "next/link";
import { ArrowLeft, Clock3, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-4xl items-center justify-center">
      <section className="relative w-full overflow-hidden rounded-3xl border border-border/70 bg-card px-6 py-14 text-center shadow-xl shadow-slate-900/[0.04] sm:px-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--primary)_13%,transparent),transparent_65%)]" />
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-8 ring-primary/[0.035]">
          <Icon className="h-9 w-9" />
        </div>
        <div className="relative mt-6 inline-flex items-center gap-1.5 rounded-full border border-amber-500/15 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
          <Clock3 className="h-3.5 w-3.5" /> قيد التطوير
        </div>
        <h1 className="relative mt-4 font-display text-2xl font-bold">{title}</h1>
        <p className="relative mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">{description} نعمل على تقديم تجربة متكاملة وآمنة تتوافق مع سير عمل فريقك.</p>
        <div className="relative mt-7 flex justify-center">
          <Button asChild variant="outline"><Link href="/dashboard">العودة للوحة التحكم <ArrowLeft /></Link></Button>
        </div>
      </section>
    </div>
  );
}
