import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentTenantId } from "../../common/tenant-context";
import { CreateDetentionClaimDto, CreateTransportationLoadDto, LoadMilestoneDto, UpdateClaimStatusDto } from "./transportation.dto";
import { TransportationService } from "./transportation.service";

@ApiTags("transportation") @ApiBearerAuth() @Controller("transportation")
export class TransportationController {
  constructor(private readonly service:TransportationService) {}
  @Get("dashboard") dashboard(){return this.service.dashboard(currentTenantId());}
  @Post("loads") createLoad(@Body() input:CreateTransportationLoadDto){return this.service.createLoad(currentTenantId(),input);}
  @Post("loads/:id/arrival") arrival(@Param("id")id:string,@Body()input:LoadMilestoneDto){return this.service.recordArrival(currentTenantId(),id,input.occurredAt);}
  @Post("loads/:id/departure") departure(@Param("id")id:string,@Body()input:LoadMilestoneDto){return this.service.recordDeparture(currentTenantId(),id,input.occurredAt);}
  @Post("loads/:id/claims/detention") claim(@Param("id")id:string,@Body()input:CreateDetentionClaimDto){return this.service.createDetentionClaim(currentTenantId(),id,input);}
  @Patch("claims/:id/status") status(@Param("id")id:string,@Body()input:UpdateClaimStatusDto){return this.service.updateClaimStatus(currentTenantId(),id,input);}
}
