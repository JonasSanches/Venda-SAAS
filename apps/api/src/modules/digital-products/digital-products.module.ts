import { Module } from "@nestjs/common";
import { DigitalProductsController } from "./digital-products.controller";
import { DigitalProductsService } from "./digital-products.service";
@Module({controllers:[DigitalProductsController],providers:[DigitalProductsService]})
export class DigitalProductsModule{}
