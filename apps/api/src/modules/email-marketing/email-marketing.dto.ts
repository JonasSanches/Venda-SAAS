import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsEmail, IsEnum, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Length, Max, Min, ValidateNested } from "class-validator";

export class ContactDto {
  @IsOptional() @IsString() @Length(1,120) firstName?:string;
  @IsOptional() @IsString() @Length(1,120) lastName?:string;
  @IsEmail() @Length(3,320) email!:string;
  @IsOptional() @IsString() @Length(3,40) phone?:string;
  @IsOptional() @IsString() @Length(1,160) company?:string;
  @IsOptional() @IsArray() @ArrayMaxSize(40) @IsString({each:true}) tags?:string[];
  @IsOptional() @IsString() @Length(1,120) source?:string;
  @IsOptional() @IsString() @Length(1,5000) notes?:string;
  @IsOptional() @IsEnum(["ACTIVE","UNSUBSCRIBED","BOUNCED","BLOCKED"] as const) status?:"ACTIVE"|"UNSUBSCRIBED"|"BOUNCED"|"BLOCKED";
}
export class ContactIdsDto { @IsArray() @ArrayMaxSize(5000) @IsUUID("4",{each:true}) contactIds!:string[]; }
export class ContactTagDto extends ContactIdsDto { @IsArray() @ArrayMaxSize(40) @IsString({each:true}) tags!:string[]; }
export class EmailListDto { @IsString() @Length(2,160) name!:string; @IsOptional() @IsString() @Length(1,5000) description?:string; }
export class TemplateDto { @IsString() @Length(2,160) name!:string; @IsOptional() @IsString() @Length(1,250) subject?:string; @IsString() @Length(1,200000) html!:string; @IsOptional() @IsString() @Length(1,200000) text?:string; }
export class CampaignDto {
  @IsString() @Length(2,180) name!:string; @IsString() @Length(1,250) subject!:string;
  @IsString() @Length(2,160) fromName!:string; @IsEmail() fromEmail!:string; @IsOptional() @IsEmail() replyTo?:string;
  @IsString() @Length(1,200000) html!:string; @IsOptional() @IsString() @Length(1,200000) text?:string;
  @IsOptional() @IsUUID() listId?:string; @IsOptional() segment?:Record<string,unknown>;
}
export class ScheduleDto { @IsOptional() @IsISO8601() scheduledAt?:string; }
export class TestEmailDto { @IsEmail() email!:string; }
export class SettingsDto { @IsOptional() @IsString() @Length(2,160) fromName?:string; @IsOptional() @IsEmail() fromEmail?:string; @IsOptional() @IsEmail() replyTo?:string; @IsOptional() @IsInt() @Min(1) @Max(10000) ratePerMinute?:number; @IsOptional() @IsString() @Length(3,80) timezone?:string; }
export class CsvPreviewDto { @IsString() @Length(1,2_000_000) csv!:string; }
export class CsvImportRowDto extends ContactDto {}
export class CsvImportDto { @IsArray() @ArrayMaxSize(10000) @ValidateNested({each:true}) @Type(()=>CsvImportRowDto) rows!:CsvImportRowDto[]; }
export class WebhookDto { @IsOptional() @IsString() id?:string; @IsOptional() @IsString() type?:string; @IsOptional() data?:Record<string,any>; }
