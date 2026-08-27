import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentBranchId, currentTenantId } from "../../common/tenant-context";
import { OperationalStore } from "../demo/operational-store.service";
import { CashMovementDto, CloseCashDto, OpenCashDto } from "./cash.dto";
@ApiTags("cash") @ApiBearerAuth() @Controller("cash")
export class CashController{
  constructor(private readonly store:OperationalStore){}
  @Get("current") current(){return this.store.currentCash(currentTenantId(),currentBranchId())}
  @Post("open") open(@Body() input:OpenCashDto){return this.store.openCashRegister(currentTenantId(),input.openingAmount,currentBranchId())}
  @Post("movements") movement(@Body() input:CashMovementDto){return this.store.cashMovement(currentTenantId(),input.type,input.amount,input.note,currentBranchId())}
  @Post("close") close(@Body() input:CloseCashDto){return this.store.closeCashRegister(currentTenantId(),input.declaredAmount,currentBranchId())}
}
