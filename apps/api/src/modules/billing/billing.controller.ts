import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { IsEmail, IsIn, IsOptional } from "class-validator";
import { verifyMercadoPagoWebhook } from "../../common/mercado-pago-webhook";
import { Public } from "../../common/public.decorator";
import { BillingService } from "./billing.service";
class CheckoutDto{@IsOptional()@IsEmail()email?:string;@IsIn(["ESSENTIAL","PERFORMANCE","SCALE"])plan!:"ESSENTIAL"|"PERFORMANCE"|"SCALE";@IsIn(["MONTHLY","SEMIANNUAL","ANNUAL"])cycle!:"MONTHLY"|"SEMIANNUAL"|"ANNUAL"}
@Controller("billing")
export class BillingController{
  constructor(private readonly billing:BillingService){}
  @Public()@Get("public/:tenantId")info(@Param("tenantId")tenantId:string){return this.billing.publicInfo(tenantId)}
  @Public()@Post("public/:tenantId/checkout")checkout(@Param("tenantId")tenantId:string,@Body()input:CheckoutDto){return this.billing.checkout(tenantId,input.plan,input.cycle,input.email)}
  @Public()@Post("webhook")webhook(@Body()body:any,@Query("data.id")queryId?:string,@Query("id")id?:string,@Headers("x-signature")signature?:string,@Headers("x-request-id")requestId?:string){verifyMercadoPagoWebhook(queryId,requestId,signature);return this.billing.webhook(String(queryId??body?.data?.id??id??""))}
}
