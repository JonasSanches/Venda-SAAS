import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { IsEmail, IsIn, IsOptional } from "class-validator";
import { Public } from "../../common/public.decorator";
import { BillingService } from "./billing.service";
class CheckoutDto{@IsOptional()@IsEmail()email?:string;@IsIn(["ESSENTIAL","PERFORMANCE","SCALE"])plan!:"ESSENTIAL"|"PERFORMANCE"|"SCALE"}
@Controller("billing")
export class BillingController{
  constructor(private readonly billing:BillingService){}
  @Public()@Get("public/:tenantId")info(@Param("tenantId")tenantId:string){return this.billing.publicInfo(tenantId)}
  @Public()@Post("public/:tenantId/checkout")checkout(@Param("tenantId")tenantId:string,@Body()input:CheckoutDto){return this.billing.checkout(tenantId,input.plan,input.email)}
  @Public()@Post("webhook")webhook(@Body()body:any,@Query("data.id")queryId?:string,@Query("id")id?:string){return this.billing.webhook(String(body?.data?.id??queryId??id??""))}
}
