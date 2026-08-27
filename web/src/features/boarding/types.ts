import type { Booking, Ticket } from "@/features/bookings";

export interface BoardingTicket extends Ticket {
  booking: Booking;
  trip: Booking["trip"];
}
