"use client";

import { create } from "zustand";

type DateRange = "today" | "week" | "month";

interface DashboardState {
  dateRange: DateRange;
  sidebarOpen: boolean;
  setDateRange: (range: DateRange) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

/**
 * حالة الواجهة (UI state) للـ Dashboard — منفصلة عن الـ server state
 * الذي يديره TanStack Query.
 */
export const useDashboardStore = create<DashboardState>((set) => ({
  dateRange: "week",
  sidebarOpen: false,
  setDateRange: (range) => set({ dateRange: range }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
