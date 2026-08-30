import{Body,Controller,ForbiddenException,Get,Post,Query,Req}from"@nestjs/common";
import type{FastifyRequest}from"fastify";
import{Public}from"../../common/public.decorator";
import{SurveyDto,VisitDto}from"./analytics.dto";
import{AnalyticsService}from"./analytics.service";
type PlatformRequest=FastifyRequest&{identity?:{tenantId:string;roles:string[]}};
@Controller("analytics")
export class AnalyticsController{
  constructor(private readonly analytics:AnalyticsService){}
  @Public()@Post("visit")record(@Body()input:VisitDto,@Req()request:FastifyRequest){return this.analytics.record(input,request)}
  @Public()@Post("survey")survey(@Body()input:SurveyDto,@Req()request:FastifyRequest){return this.analytics.saveSurvey(input,request)}
  @Get()report(@Req()request:PlatformRequest,@Query("days")days?:string,@Query("page")page?:string){if(request.identity?.tenantId!=="10000000-0000-4000-8000-000000000001"||!request.identity.roles.includes("PLATFORM_ADMIN"))throw new ForbiddenException("Acesso exclusivo da plataforma");return this.analytics.report(Number(days),Number(page))}
  @Get("surveys")surveys(@Req()request:PlatformRequest){if(request.identity?.tenantId!=="10000000-0000-4000-8000-000000000001"||!request.identity.roles.includes("PLATFORM_ADMIN"))throw new ForbiddenException("Acesso exclusivo da plataforma");return this.analytics.surveys()}
}
