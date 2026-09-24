import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentTenantId } from "../../common/tenant-context";
import { Public } from "../../common/public.decorator";
import { LinkDto, PublicCheckoutDto } from "./qr-checkout.dto";
import { QrCheckoutService } from "./qr-checkout.service";
@ApiTags("qr-checkout")@Controller("qr-checkout")export class QrCheckoutController{constructor(private readonly service:QrCheckoutService){}@ApiBearerAuth()@Get("links")links(){return this.service.links(currentTenantId())}@ApiBearerAuth()@Get("dashboard")dashboard(){return this.service.dashboard(currentTenantId())}@ApiBearerAuth()@Post("links")create(@Body()input:LinkDto){return this.service.create(currentTenantId(),input)}@ApiBearerAuth()@Delete("links/:id")remove(@Param("id")id:string){return this.service.remove(currentTenantId(),id)}@Public()@Get(":token")publicLink(@Param("token")token:string){return this.service.publicLink(token)}@Public()@Post(":token/checkout")checkout(@Param("token")token:string,@Body()input:PublicCheckoutDto){return this.service.checkout(token,input)}@Public()@Post("webhook")webhook(@Body()body:any){return this.service.webhook(String(body?.data?.id??body?.id??""))}}
