"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelTrip, createTrip, fetchTrips, updateTrip } from "../api";
import type { CreateTripInput, TripFilters, UpdateTripInput } from "../types";

export const tripKeys = {
  all: ["trips"] as const,
  list: (filters: TripFilters) => [...tripKeys.all, "list", filters] as const,
};

export function useTrips(filters: TripFilters = {}) {
  return useQuery({
    queryKey: tripKeys.list(filters),
    queryFn: () => fetchTrips(filters),
    staleTime: 30_000,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTripInput) => createTrip(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTripInput }) =>
      updateTrip(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useCancelTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelTrip(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
