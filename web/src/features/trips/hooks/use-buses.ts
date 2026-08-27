"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBuses } from "../api";

export function useBuses() {
  return useQuery({
    queryKey: ["buses", "list"],
    queryFn: fetchBuses,
    staleTime: 60_000,
  });
}
