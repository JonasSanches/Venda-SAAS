import { Module } from "@nestjs/common";
import { DigitalProductsController } from "./digital-products.controller";
import { DigitalProductsService } from "./digital-products.service";
@Module({controllers:[DigitalProductsController],providers:[DigitalProductsService],exports:[DigitalProductsService]})
export class DigitalProductsModule{}
