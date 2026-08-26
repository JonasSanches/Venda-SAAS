import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentTenantId } from "../../common/tenant-context";
import { OperationalStore } from "../demo/operational-store.service";
import { CancelOrderDto, CheckoutDto } from "./sales.dto";
@ApiTags("sales") @ApiBearerAuth() @Controller("sales")
export class SalesController{
  constructor(private readonly store:OperationalStore){}
  @Get("orders") orders(){return this.store.orders(currentTenantId())}
  @Get("summary") summary(){return this.store.summary(currentTenantId())}
  @Post("checkout") checkout(@Body() input:CheckoutDto){return this.store.checkout(currentTenantId(),input)}
  @Post("orders/:id/cancel") cancel(@Param("id") id:string,@Body() input:CancelOrderDto){return this.store.cancelOrder(currentTenantId(),id,input.reason)}
}
