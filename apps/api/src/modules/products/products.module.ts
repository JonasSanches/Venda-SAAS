import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { OrderSettingsService } from "./order-settings.service";

@Module({ controllers: [ProductsController], providers: [ProductsService, OrderSettingsService] })
export class ProductsModule {}
