import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentTenantId } from "../../common/tenant-context";
import { Public } from "../../common/public.decorator";
import { CampaignDto, ContactDto, ContactIdsDto, ContactTagDto, CsvImportDto, CsvPreviewDto, EmailListDto, ScheduleDto, SettingsDto, TemplateDto, TestEmailDto, WebhookDto } from "./email-marketing.dto";
import { EmailMarketingService } from "./email-marketing.service";

@ApiTags("email-marketing") @ApiBearerAuth() @Controller("email-marketing")
export class EmailMarketingController {
  constructor(private readonly service:EmailMarketingService){}
  @Get("dashboard") dashboard(){return this.service.dashboard(currentTenantId());}
  @Get("contacts") contacts(@Query() q:any){return this.service.contacts(currentTenantId(),q);}
  @Post("contacts") contact(@Body() input:ContactDto){return this.service.createContact(currentTenantId(),input);}
  @Patch("contacts/:id") updateContact(@Param("id")id:string,@Body()input:ContactDto){return this.service.updateContact(currentTenantId(),id,input);}
  @Delete("contacts/:id") deleteContact(@Param("id")id:string){return this.service.deleteContact(currentTenantId(),id);}
  @Post("contacts/tags") tags(@Body()input:ContactTagDto){return this.service.applyTags(currentTenantId(),input.contactIds,input.tags);}
  @Post("contacts/lists/:listId") listMembers(@Param("listId")listId:string,@Body()input:ContactIdsDto){return this.service.addMembers(currentTenantId(),listId,input.contactIds);}
  @Post("contacts/import/preview") preview(@Body()input:CsvPreviewDto){return this.service.csvPreview(currentTenantId(),input.csv);}
  @Post("contacts/import") import(@Body()input:CsvImportDto){return this.service.importContacts(currentTenantId(),input.rows);}
  @Get("lists") lists(){return this.service.lists(currentTenantId());}
  @Post("lists") list(@Body()input:EmailListDto){return this.service.createList(currentTenantId(),input);}
  @Patch("lists/:id") updateList(@Param("id")id:string,@Body()input:EmailListDto){return this.service.updateList(currentTenantId(),id,input);}
  @Delete("lists/:id") deleteList(@Param("id")id:string){return this.service.deleteList(currentTenantId(),id);}
  @Get("templates") templates(){return this.service.templates(currentTenantId());}
  @Post("templates") template(@Body()input:TemplateDto){return this.service.createTemplate(currentTenantId(),input);}
  @Patch("templates/:id") updateTemplate(@Param("id")id:string,@Body()input:TemplateDto){return this.service.updateTemplate(currentTenantId(),id,input);}
  @Delete("templates/:id") deleteTemplate(@Param("id")id:string){return this.service.deleteTemplate(currentTenantId(),id);}
  @Get("campaigns") campaigns(){return this.service.campaigns(currentTenantId());}
  @Post("campaigns") campaign(@Body()input:CampaignDto){return this.service.createCampaign(currentTenantId(),input);}
  @Patch("campaigns/:id") updateCampaign(@Param("id")id:string,@Body()input:CampaignDto){return this.service.updateCampaign(currentTenantId(),id,input);}
  @Post("campaigns/:id/test") test(@Param("id")id:string,@Body()input:TestEmailDto){return this.service.sendTest(currentTenantId(),id,input.email);}
  @Post("campaigns/:id/schedule") schedule(@Param("id")id:string,@Body()input:ScheduleDto){return this.service.schedule(currentTenantId(),id,input.scheduledAt);}
  @Post("campaigns/:id/pause") pause(@Param("id")id:string){return this.service.pause(currentTenantId(),id);}
  @Post("campaigns/:id/cancel") cancel(@Param("id")id:string){return this.service.cancel(currentTenantId(),id);}
  @Get("logs") logs(@Query()q:any){return this.service.logs(currentTenantId(),q);}
  @Get("settings") settings(){return this.service.settings(currentTenantId());}
  @Put("settings") saveSettings(@Body()input:SettingsDto){return this.service.saveSettings(currentTenantId(),input);}
  @Post("settings/test") verify(){return this.service.verifyConfiguration();}

  @Public() @Get("unsubscribe") unsubscribe(@Query("token")token:string){return this.service.unsubscribe(token);}
  @Public() @Post("webhook") webhook(@Body()input:WebhookDto,@Headers("x-email-webhook-secret")secret?:string){return this.service.processWebhook(input,secret);}
}
