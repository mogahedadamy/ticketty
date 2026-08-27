"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, fetchRoutes, updateRoute } from "../api";
import type { CreateRouteInput, UpdateRouteInput } from "../types";

export const routeKeys = {
  all: ["routes"] as const,
  list: (search: string) => [...routeKeys.all, "list", search] as const,
};

export function useRoutes(search = "") {
  return useQuery({
    queryKey: routeKeys.list(search),
    queryFn: () => fetchRoutes(search),
    staleTime: 60_000,
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRouteInput) => createRoute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: routeKeys.all }),
  });
}

export function useUpdateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRouteInput }) =>
      updateRoute(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: routeKeys.all }),
  });
}
