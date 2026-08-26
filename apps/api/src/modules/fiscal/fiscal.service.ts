import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { supportedFiscalStates, type SupportedFiscalState } from "@varejo/contracts";
import { FiscalProvider } from "./fiscal-provider";

@Injectable()
export class FiscalService {
  constructor(@Inject(FiscalProvider) private readonly provider: FiscalProvider) {}

  assertState(state: string): asserts state is SupportedFiscalState {
    if (!supportedFiscalStates.includes(state as SupportedFiscalState)) {
      throw new BadRequestException(`UF ${state} ainda não homologada. UFs disponíveis: SP, RJ`);
    }
  }
}
