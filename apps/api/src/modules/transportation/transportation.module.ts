import { Module } from "@nestjs/common";
import { TransportationController } from "./transportation.controller";
import { TransportationService } from "./transportation.service";

@Module({controllers:[TransportationController],providers:[TransportationService]})
export class TransportationModule {}
