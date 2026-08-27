import { apiClient } from "@/lib/api-client";
import type { Agent, AgentInput, CommissionRecord } from "./types";
export const fetchAgents=(search="")=>apiClient<Agent[]>(`/agents${search?`?search=${encodeURIComponent(search)}`:""}`);
export const createAgent=(input:AgentInput)=>apiClient<Agent>("/agents",{method:"POST",body:input});
export const updateAgent=(id:string,input:Partial<AgentInput>)=>apiClient<Agent>(`/agents/${id}`,{method:"PATCH",body:input});
export const fetchAgentCommissions=(id:string)=>apiClient<CommissionRecord[]>(`/agents/${id}/commissions`);
