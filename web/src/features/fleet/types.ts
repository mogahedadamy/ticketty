export type BusStatus = "READY" | "MAINTENANCE" | "OUT_OF_SERVICE";
export type DriverStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type SeatType = "REGULAR" | "VIP" | "DRIVER" | "DISABLED" | "BLOCKED";

export interface SeatDefinition { id: string; row: number; column: number; label: string; seatType: SeatType }
export interface SeatTemplate { id: string; organizationId: string; name: string; rows: number; columnsPerRow: number; aisleAfterColumn: number; seats: SeatDefinition[]; _count?: { buses: number } }
export interface Bus { id: string; organizationId: string; branchId: string | null; plateNumber: string; model: string | null; year: number | null; seatTemplateId: string; status: BusStatus; seatTemplate: SeatTemplate; createdAt: string; updatedAt: string }
export interface Driver { id: string; organizationId: string; branchId: string | null; name: string; phone: string; licenseNumber: string; licenseExpiry: string; status: DriverStatus; createdAt: string; updatedAt: string; _count: { trips: number } }
export interface CreateBusInput { plateNumber: string; model?: string; year?: number; seatTemplateId: string; status?: BusStatus }
export type UpdateBusInput = Partial<CreateBusInput>;
export interface CreateDriverInput { name: string; phone: string; licenseNumber: string; licenseExpiry: string; status?: DriverStatus; branchId?: string }
export type UpdateDriverInput = Partial<CreateDriverInput>;
export interface CreateSeatTemplateInput { name: string; rows: number; columnsPerRow: number; aisleAfterColumn: number }
