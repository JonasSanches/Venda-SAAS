import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { IsString, Length } from "class-validator";
import { Public } from "../../common/public.decorator";
import { currentTenantId, currentUserId } from "../../common/tenant-context";
import { ScannerService } from "./scanner.service";
class ScanCodeDto{@IsString()@Length(2,100)code!:string}
@Controller("scanner")
export class ScannerController{constructor(private readonly scanner:ScannerService){}@Post("sessions")create(){return this.scanner.create(currentTenantId(),currentUserId())}@Get("sessions/:id/events")events(@Param("id")id:string,@Query("cursor")cursor?:string){return this.scanner.events(currentTenantId(),currentUserId(),id,cursor)}@Public()@Get("mobile/:token")info(@Param("token")token:string){return this.scanner.info(token)}@Public()@Post("mobile/:token")submit(@Param("token")token:string,@Body()body:ScanCodeDto){return this.scanner.submit(token,body.code)}}
