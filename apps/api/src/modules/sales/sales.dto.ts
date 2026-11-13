import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength, ValidateNested } from "class-validator";
export class CheckoutItemDto {
  @IsUUID() productId!: string;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(1000000) quantity!: number;
}
export class CheckoutDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({each:true}) @Type(()=>CheckoutItemDto) items!: CheckoutItemDto[];
  @IsString() @IsIn(["DINHEIRO","PIX","CREDITO","DEBITO"]) paymentMethod!:string;
  @IsOptional() @IsIn(["PDV","DELIVERY"]) channel?:"PDV"|"DELIVERY";
}
export class CancelOrderDto{ @IsString() @MinLength(4) reason!:string; }
export class DashboardSettingsDto{ @IsInt() @Min(5) @Max(240) deliveryAlertMinutes!:number; }
