import { Global, Module } from "@nestjs/common";
import { DemoStore } from "./demo-store.service";
import { OperationalStore } from "./operational-store.service";
@Global()
@Module({ providers: [DemoStore, OperationalStore], exports: [DemoStore, OperationalStore] })
export class DemoModule {}
