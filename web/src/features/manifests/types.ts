import type { Trip } from "@/features/trips";
export interface ManifestTicket { id:string; number:string; passengerName:string; passengerPhone:string; passengerNationalId:string|null; seatLabel:string; boardingStop:string|null; dropOffStop:string|null; fare:string; status:string; booking:{agent:{name:string}|null} }
export interface ManifestRecord { id:string; tripId:string; generatedAt:string; lockedAt:string|null; version:number }
export interface ManifestData { manifest:ManifestRecord|null; trip:Trip; tickets:ManifestTicket[]; totals:{passengers:number;revenue:number} }
