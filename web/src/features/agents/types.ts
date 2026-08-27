export type AgentType = "INTERNAL" | "EXTERNAL";
export type CommissionType = "PERCENT" | "FIXED";
export interface Agent { id:string; organizationId:string; branchId:string|null; userId:string|null; name:string; phone:string|null; type:AgentType; commissionType:CommissionType; commissionValue:string; active:boolean; createdAt:string; updatedAt:string; _count:{bookings:number;commissions:number}; financials:{earnedCommission:string;settledCommission:string;balance:string}; user?:{id:string;name:string;email:string}|null }
export interface AgentInput { name:string; phone?:string; type?:AgentType; commissionType?:CommissionType; commissionValue?:number; active?:boolean; userId?:string }
export interface CommissionRecord { id:string; amount:string; reversedAt:string|null; reversalReason:string|null; createdAt:string; ticket:{number:string;passengerName:string}; booking:{trip:{route:{name:string}}} }
