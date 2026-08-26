import { Module } from "@nestjs/common";
import { FiscalProvider } from "./fiscal-provider";
import { FiscalService } from "./fiscal.service";
import { HomologationFiscalProvider } from "./homologation.provider";

@Module({
  providers: [FiscalService, { provide: FiscalProvider, useClass: HomologationFiscalProvider }],
  exports: [FiscalService]
})
export class FiscalModule {}
