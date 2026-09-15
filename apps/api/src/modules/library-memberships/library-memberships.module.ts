import { Module } from "@nestjs/common";
import { DigitalProductsModule } from "../digital-products/digital-products.module";
import { LibraryMembershipsController } from "./library-memberships.controller";
import { LibraryMembershipsService } from "./library-memberships.service";

@Module({imports:[DigitalProductsModule],controllers:[LibraryMembershipsController],providers:[LibraryMembershipsService]})
export class LibraryMembershipsModule{}
