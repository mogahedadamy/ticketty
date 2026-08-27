"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompact } from "@/lib/utils";
import type { BookingDistribution } from "@/types/dashboard";

interface BookingChartProps {
  data: BookingDistribution[];
}

export function BookingChart({ data }: BookingChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">مزيج المدفوعات</CardTitle>
        <CardDescription>توزيع العمليات حسب طريقة الدفع</CardDescription>
      </CardHeader>
      <CardContent>
        <div dir="ltr" className="relative h-56">
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold text-foreground">{formatCompact(total)}</span>
            <span className="text-[10px] text-muted-foreground">عملية دفع</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const v = Number(value ?? 0);
                  const n = String(name ?? "");
                  return [
                    `${formatCompact(v)} (${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%)`,
                    n,
                  ] as [string, string];
                }}
                contentStyle={{
                  direction: "rtl",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <ul className="mt-4 space-y-2">
          {data.map((entry) => (
            <li
              key={entry.name}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="mr-auto font-semibold">
                {total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}