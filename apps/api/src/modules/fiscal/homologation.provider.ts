import { Injectable } from "@nestjs/common";
import { FiscalProvider, FiscalRequest, FiscalResult } from "./fiscal-provider";

@Injectable()
export class HomologationFiscalProvider extends FiscalProvider {
  async authorize(request: FiscalRequest): Promise<FiscalResult> {
    throw new Error(`SEFAZ ${request.state} homologation adapter is not configured`);
  }
  async cancel(): Promise<FiscalResult> { throw new Error("Fiscal cancellation adapter is not configured"); }
  async status(): Promise<FiscalResult> { throw new Error("Fiscal status adapter is not configured"); }
}
