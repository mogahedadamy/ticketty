"use client";
import {keepPreviousData,useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {createAgent,fetchAgentCommissions,fetchAgents,updateAgent} from "../api";
import type {AgentInput} from "../types";
const keys={all:["agents"] as const,list:(s:string)=>["agents","list",s] as const,commissions:(id:string)=>["agents",id,"commissions"] as const};
export const useAgents=(search="")=>useQuery({queryKey:keys.list(search),queryFn:()=>fetchAgents(search),placeholderData:keepPreviousData,staleTime:30_000});
export const useAgentCommissions=(id:string|null)=>useQuery({queryKey:keys.commissions(id??"none"),queryFn:()=>fetchAgentCommissions(id as string),enabled:Boolean(id)});
export function useCreateAgent(){const q=useQueryClient();return useMutation({mutationFn:(input:AgentInput)=>createAgent(input),onSuccess:()=>q.invalidateQueries({queryKey:keys.all})});}
export function useUpdateAgent(){const q=useQueryClient();return useMutation({mutationFn:({id,input}:{id:string;input:Partial<AgentInput>})=>updateAgent(id,input),onSuccess:()=>q.invalidateQueries({queryKey:keys.all})});}
