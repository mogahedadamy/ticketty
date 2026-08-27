"use client";

import { AlertCircle, Clock3, Map, MapPin, Pencil, Power, Route as RouteIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "../formatters";
import { useUpdateRoute } from "../hooks/use-routes";
import type { TransportRoute } from "../types";

interface RoutesListProps {
  routes?: TransportRoute[];
  isLoading: boolean;
  isError: boolean;
  canManage?: boolean;
  onEdit?: (route: TransportRoute) => void;
}

export function RoutesList({ routes, isLoading, isError, canManage, onEdit }: RoutesListProps) {
  const updateRoute = useUpdateRoute();
  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-48" />)}</div>;
  }
  if (isError) {
    return <EmptyState icon={<AlertCircle className="h-10 w-10" />} title="تعذر تحميل خطوط السير" description="تحقق من الاتصال بالخادم ثم حاول مجددًا." />;
  }
  if (!routes?.length) {
    return <EmptyState icon={<Map className="h-10 w-10" />} title="لا توجد خطوط سير" description="أضف أول خط سير لتتمكن من جدولة الرحلات." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {routes.map((route) => (
        <Card key={route.id} className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg">
          <CardContent className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="rounded-2xl bg-primary/10 p-2.5 text-primary ring-4 ring-primary/[0.035] transition-transform group-hover:scale-105"><RouteIcon className="h-5 w-5" /></div>
              <Badge variant={route.active ? "success" : "secondary"}>{route.active ? "نشط" : "متوقف"}</Badge>
            </div>
            <h3 className="font-semibold">{route.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{route.fromCity} ← {route.toCity}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{route.distanceKm != null ? `${route.distanceKm} كم` : "غير محددة"}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4" /><span>{formatDuration(route.durationMinutes)}</span></div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{route.stops.length} محطة وسيطة</span>
              <span>{route._count?.trips ?? 0} رحلة</span>
            </div>
            {canManage ? (
              <div className="mt-4 flex gap-2 border-t pt-4">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onEdit?.(route)}><Pencil /> تعديل</Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  disabled={updateRoute.isPending}
                  onClick={() => updateRoute.mutate({ id: route.id, input: { active: !route.active } })}
                >
                  <Power /> {route.active ? "تعطيل" : "تفعيل"}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
