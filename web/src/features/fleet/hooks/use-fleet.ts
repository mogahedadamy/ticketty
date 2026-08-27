"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBus, createDriver, createSeatTemplate, fetchBuses, fetchDrivers, fetchSeatTemplates, updateBus, updateDriver } from "../api";
import type { CreateBusInput, CreateDriverInput, CreateSeatTemplateInput, DriverStatus, UpdateBusInput, UpdateDriverInput } from "../types";

const fleetKeys = { buses: ["fleet", "buses"] as const, templates: ["fleet", "seat-templates"] as const, drivers: ["fleet", "drivers"] as const };
export const useBuses = () => useQuery({ queryKey: fleetKeys.buses, queryFn: fetchBuses, staleTime: 30_000 });
export const useSeatTemplates = () => useQuery({ queryKey: fleetKeys.templates, queryFn: fetchSeatTemplates, staleTime: 60_000 });
export function useDrivers(search = "", status?: DriverStatus) { return useQuery({ queryKey: [...fleetKeys.drivers, search, status], queryFn: () => fetchDrivers(search, status), placeholderData: keepPreviousData, staleTime: 30_000 }); }
function invalidator(queryClient: ReturnType<typeof useQueryClient>, key: readonly string[]) { return () => queryClient.invalidateQueries({ queryKey: key }); }
export function useCreateBus() { const q = useQueryClient(); return useMutation({ mutationFn: (input: CreateBusInput) => createBus(input), onSuccess: invalidator(q, fleetKeys.buses) }); }
export function useUpdateBus() { const q = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: UpdateBusInput }) => updateBus(id, input), onSuccess: invalidator(q, fleetKeys.buses) }); }
export function useCreateDriver() { const q = useQueryClient(); return useMutation({ mutationFn: (input: CreateDriverInput) => createDriver(input), onSuccess: invalidator(q, fleetKeys.drivers) }); }
export function useUpdateDriver() { const q = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: UpdateDriverInput }) => updateDriver(id, input), onSuccess: invalidator(q, fleetKeys.drivers) }); }
export function useCreateSeatTemplate() { const q = useQueryClient(); return useMutation({ mutationFn: (input: CreateSeatTemplateInput) => createSeatTemplate(input), onSuccess: invalidator(q, fleetKeys.templates) }); }
