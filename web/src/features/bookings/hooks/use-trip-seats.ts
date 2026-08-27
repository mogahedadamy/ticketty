"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTripSeats, holdSeat, releaseSeat } from "../api";

export const tripSeatKeys = {
  all: ["trip-seats"] as const,
  detail: (tripId: string) => [...tripSeatKeys.all, tripId] as const,
};

export function useTripSeats(tripId: string | null) {
  return useQuery({
    queryKey: tripSeatKeys.detail(tripId ?? "none"),
    queryFn: () => fetchTripSeats(tripId as string),
    enabled: Boolean(tripId),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function useHoldSeat(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seatId: string) => holdSeat(tripId, seatId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tripSeatKeys.detail(tripId) }),
  });
}

export function useReleaseSeat(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seatId: string) => releaseSeat(seatId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tripSeatKeys.detail(tripId) }),
  });
}
