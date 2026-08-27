import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = { tenantId: string; userId: string; roles: string[]; branchId?: string; requestId: string };

export const tenantContext = new AsyncLocalStorage<RequestContext>();

export function currentTenantId(): string {
  const tenantId = tenantContext.getStore()?.tenantId;
  if (!tenantId) throw new Error("Tenant context is unavailable");
  return tenantId;
}
export function currentBranchId():string|undefined{return tenantContext.getStore()?.branchId}
