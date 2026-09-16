import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentBranchId, currentTenantId } from "../../common/tenant-context";
import { OperationalStore } from "../demo/operational-store.service";
import { CancelOrderDto, CheckoutDto, DashboardSettingsDto } from "./sales.dto";
@ApiTags("sales") @ApiBearerAuth() @Controller("sales")
export class SalesController{
  constructor(private readonly store:OperationalStore){}
  @Get("orders") orders(){return this.store.orders(currentTenantId(),currentBranchId())}
  @Get("summary") summary(){return this.store.summary(currentTenantId(),currentBranchId())}
  @Get("dashboard") dashboard(){return this.store.dashboard(currentTenantId(),currentBranchId())}
  @Put("dashboard/settings") dashboardSettings(@Body() input:DashboardSettingsDto){return this.store.updateDashboardSettings(currentTenantId(),input.deliveryAlertMinutes)}
  @Post("checkout") checkout(@Body() input:CheckoutDto){return this.store.checkout(currentTenantId(),input,currentBranchId())}
  @Post("orders/:id/deliver") deliver(@Param("id") id:string){return this.store.markOrderDelivered(currentTenantId(),id,currentBranchId())}
  @Post("orders/:id/cancel") cancel(@Param("id") id:string,@Body() input:CancelOrderDto){return this.store.cancelOrder(currentTenantId(),id,input.reason,currentBranchId())}
}
