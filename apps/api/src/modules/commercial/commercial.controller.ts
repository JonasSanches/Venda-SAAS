import { Body, Controller, Get, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentTenantId } from "../../common/tenant-context";
import { CommercialService } from "./commercial.service";
import { FiscalSettingsDto, IssueDto, PartyDto } from "./commercial.dto";
@ApiTags("commercial")@ApiBearerAuth()@Controller("commercial")
export class CommercialController{constructor(private readonly service:CommercialService){}@Get("parties")parties(@Query("type")type?:string){return this.service.parties(currentTenantId(),type)}@Post("parties")add(@Body()input:PartyDto){return this.service.addParty(currentTenantId(),input)}@Get("fiscal/settings")settings(){return this.service.getSettings(currentTenantId())}@Put("fiscal/settings")set(@Body()input:FiscalSettingsDto){return this.service.setSettings(currentTenantId(),input)}@Get("fiscal/documents")documents(){return this.service.documents(currentTenantId())}@Post("fiscal/issue")issue(@Body()input:IssueDto){return this.service.issue(currentTenantId(),input.orderId,input.model)}}
