import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUUID, Length, Min, ValidateNested } from "class-validator";
export class OfferDto{@IsOptional()@IsUUID() productId?:string;@IsString()@Length(2,180)title!:string;@IsOptional()@IsString()@Length(1,2000)description?:string;@Min(.01)price!:number;}
export class LinkDto{@IsString()@Length(2,160)name!:string;@IsBoolean()deliveryEnabled!:boolean;@IsBoolean()addressRequired!:boolean;@IsOptional()@IsBoolean()forceNew?:boolean;@IsArray()@ArrayMinSize(1)@ArrayMaxSize(100)@ValidateNested({each:true})@Type(()=>OfferDto)offers!:OfferDto[];}
export class PublicItemDto{@IsUUID()offerId!:string;@IsInt()@Min(1)quantity!:number;}
export class PublicCheckoutDto{@IsString()@Length(2,160)buyerName!:string;@IsOptional()@IsEmail()buyerEmail?:string;@IsOptional()@IsString()@Length(5,40)buyerPhone?:string;@IsOptional()@IsString()@Length(5,1000)deliveryAddress?:string;@IsArray()@ArrayMinSize(1)@ArrayMaxSize(50)@ValidateNested({each:true})@Type(()=>PublicItemDto)items!:PublicItemDto[];}
