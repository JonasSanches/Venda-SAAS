import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { TenantContextModule } from "./common/tenant-context.module";
import { ProductsModule } from "./modules/products/products.module";
import { FiscalModule } from "./modules/fiscal/fiscal.module";
import { DemoModule } from "./modules/demo/demo.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthGuard } from "./common/auth.guard";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { SalesModule } from "./modules/sales/sales.module";
import { CashModule } from "./modules/cash/cash.module";
import { CommercialModule } from "./modules/commercial/commercial.module";
import { PlatformModule } from "./modules/platform/platform.module";
import { BranchesModule } from "./modules/branches/branches.module";
import { BillingModule } from "./modules/billing/billing.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    DemoModule,
    AuthModule,
    TenantContextModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    CashModule,
    CommercialModule,
    PlatformModule,
    BranchesModule,
    FiscalModule,
    BillingModule,
    AnalyticsModule
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }]
})
export class AppModule {}
