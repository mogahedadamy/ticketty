"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelBooking, fetchBookings } from "../api";
import type { BookingFilters } from "../types";
import { tripSeatKeys } from "./use-trip-seats";

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (filters: BookingFilters) => [...bookingKeys.all, "list", filters] as const,
};

export function useBookings(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: () => fetchBookings(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelBooking(id, reason),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: tripSeatKeys.detail(booking.tripId) });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
