import { ArrayMinSize, IsArray, IsIn, IsString, MinLength } from "class-validator";
export class CheckoutDto{
  @IsArray() @ArrayMinSize(1) items!:Array<{productId:string;quantity:number}>;
  @IsString() @IsIn(["DINHEIRO","PIX","CREDITO","DEBITO"]) paymentMethod!:string;
}
export class CancelOrderDto{ @IsString() @MinLength(4) reason!:string; }
