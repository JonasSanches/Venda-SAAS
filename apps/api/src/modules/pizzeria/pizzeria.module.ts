import { Module } from "@nestjs/common";
import { PizzeriaController } from "./pizzeria.controller";
import { PizzeriaService } from "./pizzeria.service";
import { PizzeriaDemoStore } from "./pizzeria-demo-store.service";

@Module({ controllers:[PizzeriaController], providers:[PizzeriaService,PizzeriaDemoStore] })
export class PizzeriaModule {}
