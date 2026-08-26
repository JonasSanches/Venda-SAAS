import type { SupportedFiscalState } from "@varejo/contracts";

export type FiscalRequest = {
  idempotencyKey: string;
  tenantId: string;
  branchId: string;
  state: SupportedFiscalState;
  model: "55" | "65";
  payload: unknown;
};

export type FiscalResult =
  | { status: "AUTHORIZED"; accessKey: string; protocol: string; xml: string }
  | { status: "REJECTED"; code: string; reason: string };

export abstract class FiscalProvider {
  abstract authorize(request: FiscalRequest): Promise<FiscalResult>;
  abstract cancel(accessKey: string, protocol: string, reason: string): Promise<FiscalResult>;
  abstract status(accessKey: string): Promise<FiscalResult>;
}
