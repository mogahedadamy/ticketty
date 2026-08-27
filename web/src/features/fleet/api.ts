import { apiClient } from "@/lib/api-client";
import type { Bus, CreateBusInput, CreateDriverInput, CreateSeatTemplateInput, Driver, DriverStatus, SeatTemplate, UpdateBusInput, UpdateDriverInput } from "./types";

export const fetchBuses = () => apiClient<Bus[]>("/buses");
export const fetchSeatTemplates = () => apiClient<SeatTemplate[]>("/seat-templates");
export const fetchDrivers = (search = "", status?: DriverStatus) => {
  const params = new URLSearchParams(); if (search) params.set("search", search); if (status) params.set("status", status);
  return apiClient<Driver[]>(`/drivers${params.size ? `?${params}` : ""}`);
};
export const createBus = (input: CreateBusInput) => apiClient<Bus>("/buses", { method: "POST", body: input });
export const updateBus = (id: string, input: UpdateBusInput) => apiClient<Bus>(`/buses/${id}`, { method: "PATCH", body: input });
export const createDriver = (input: CreateDriverInput) => apiClient<Driver>("/drivers", { method: "POST", body: input });
export const updateDriver = (id: string, input: UpdateDriverInput) => apiClient<Driver>(`/drivers/${id}`, { method: "PATCH", body: input });
export const createSeatTemplate = (input: CreateSeatTemplateInput) => apiClient<SeatTemplate>("/seat-templates", { method: "POST", body: input });
