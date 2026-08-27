import { apiClient } from "@/lib/api-client";
import type { BoardingTicket } from "./types";

export function fetchTicketByQr(qrCode: string): Promise<BoardingTicket> {
  return apiClient<BoardingTicket>(`/tickets/by-qr/${encodeURIComponent(qrCode)}`);
}

export function fetchTicketById(ticketId: string): Promise<BoardingTicket> {
  return apiClient<BoardingTicket>(`/tickets/${encodeURIComponent(ticketId)}`);
}

export function checkInTicket(ticketId: string): Promise<BoardingTicket> {
  return apiClient<BoardingTicket>(`/tickets/${encodeURIComponent(ticketId)}/check-in`, { method: "POST" });
}
