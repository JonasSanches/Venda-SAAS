import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";
export class CheckoutDto{
  @IsArray() @ArrayMinSize(1) items!:Array<{productId:string;quantity:number}>;
  @IsString() @IsIn(["DINHEIRO","PIX","CREDITO","DEBITO"]) paymentMethod!:string;
  @IsOptional() @IsIn(["PDV","DELIVERY"]) channel?:"PDV"|"DELIVERY";
}
export class CancelOrderDto{ @IsString() @MinLength(4) reason!:string; }
export class DashboardSettingsDto{ @IsInt() @Min(5) @Max(240) deliveryAlertMinutes!:number; }
