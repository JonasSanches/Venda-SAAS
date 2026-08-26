export const supportedFiscalStates = ["SP", "RJ"] as const;
export type SupportedFiscalState = (typeof supportedFiscalStates)[number];

export type TenantIdentity = {
  tenantId: string;
  userId: string;
  roles: string[];
};

export type ApiEnvelope<T> = {
  data: T;
  requestId: string;
};

export const FiscalDocumentType = {
  NFE: "NFE",
  NFCE: "NFCE"
} as const;
export type FiscalDocumentType = (typeof FiscalDocumentType)[keyof typeof FiscalDocumentType];

export const FiscalStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  AUTHORIZED: "AUTHORIZED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  CONTINGENCY: "CONTINGENCY"
} as const;
export type FiscalStatus = (typeof FiscalStatus)[keyof typeof FiscalStatus];
