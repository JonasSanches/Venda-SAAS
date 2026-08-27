import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentBranchId, currentTenantId } from "../../common/tenant-context";
import { OperationalStore } from "../demo/operational-store.service";
import { AdjustStockDto } from "./inventory.dto";
@ApiTags("inventory") @ApiBearerAuth() @Controller("inventory")
export class InventoryController{
  constructor(private readonly store:OperationalStore){}
  @Get() stock(){return this.store.stock(currentTenantId(),currentBranchId())}
  @Get("movements") movements(){return this.store.movements(currentTenantId(),currentBranchId())}
  @Post("adjustments") adjust(@Body() input:AdjustStockDto){return this.store.adjustStock(currentTenantId(),input.productId,input.quantity,input.note,currentBranchId())}
}
