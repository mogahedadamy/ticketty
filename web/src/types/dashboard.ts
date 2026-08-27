// ─── Dashboard domain types ────────────────────────────────────

export type TrendDirection = "up" | "down" | "neutral";

export interface KpiStat {
  id: string;
  title: string;
  value: number;
  /** Optional prefix/suffix for display (e.g. currency). */
  format: "number" | "currency";
  change: number; // percentage
  changeDirection: TrendDirection;
  period: string;
  icon: string; // lucide icon name
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  bookings: number;
}

export interface BookingDistribution {
  name: string;
  value: number;
  color: string;
}

export type ActivityStatus = "completed" | "pending" | "failed";

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  user: string;
  createdAt: string;
  status: ActivityStatus;
}

export interface DashboardStats {
  kpis: KpiStat[];
  revenueSeries: RevenuePoint[];
  bookingDistribution: BookingDistribution[];
  recentActivity: ActivityItem[];
}
