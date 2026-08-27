"use client";

import {
  Ticket,
  DollarSign,
  Bus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "@/components/layout/session-context";
import { useDashboardStats } from "@/hooks/useDashboard";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { BookingChart } from "@/components/dashboard/booking-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { KpiStat } from "@/types/dashboard";

const iconMap: Record<string, LucideIcon> = {
  ticket: Ticket,
  dollar: DollarSign,
  bus: Bus,
  users: Users,
};

function formatKpiValue(kpi: KpiStat): string {
  return kpi.format === "currency"
    ? formatCurrency(kpi.value)
    : kpi.value.toLocaleString("ar-SD");
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="mb-2 h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="h-72 p-5">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="h-72 p-5">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function DashboardError() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h3 className="text-lg font-semibold">تعذر تحميل البيانات</h3>
      <p className="text-sm text-muted-foreground">
        حدث خطأ أثناء جلب بيانات لوحة التحكم. حاول مرة أخرى.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const user = useSession();
  const { data, isLoading, isError } = useDashboardStats();

  return (
    <div className="mx-auto max-w-[96rem]">
      <WelcomeHeader user={user} />

      {isLoading ? (
        <DashboardLoading />
      ) : isError || !data ? (
        <DashboardError />
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.kpis.map((kpi, i) => (
              <StatsCard
                key={kpi.id}
                title={kpi.title}
                value={formatKpiValue(kpi)}
                change={
                  kpi.changeDirection === "neutral"
                    ? undefined
                    : `${kpi.changeDirection === "up" ? "+" : "-"}${kpi.change}%`
                }
                period={kpi.period}
                icon={iconMap[kpi.icon]}
                trend={kpi.changeDirection}
                delay={i * 0.05}
                accent={(["teal", "blue", "amber", "violet"] as const)[i % 4]}
              />
            ))}
          </section>

          {/* Charts */}
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChart data={data.revenueSeries} />
            </div>
            <BookingChart data={data.bookingDistribution} />
          </section>

          {/* Recent activity */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">النشاطات الأخيرة</h2>
                <p className="mt-1 text-xs text-muted-foreground">آخر الحجوزات والحركات المسجلة في المنظومة</p>
              </div>
            </div>
            <RecentActivity data={data.recentActivity} />
          </section>
        </div>
      )}
    </div>
  );
}