import { Module } from "@nestjs/common";
import { PizzeriaController } from "./pizzeria.controller";
import { PizzeriaService } from "./pizzeria.service";

@Module({ controllers:[PizzeriaController], providers:[PizzeriaService] })
export class PizzeriaModule {}
