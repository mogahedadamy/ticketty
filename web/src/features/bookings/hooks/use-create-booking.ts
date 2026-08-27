"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { createBooking } from "../api";
import type { CreateBookingInput } from "../types";
import { tripSeatKeys } from "./use-trip-seats";

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID());
  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input, idempotencyKey.current),
    onSuccess: (_, input) => {
      idempotencyKey.current = crypto.randomUUID();
      queryClient.invalidateQueries({ queryKey: tripSeatKeys.detail(input.tripId) });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
