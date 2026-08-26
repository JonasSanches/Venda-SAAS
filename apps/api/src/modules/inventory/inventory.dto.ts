import { IsNumber, IsString, IsUUID, MinLength, NotEquals } from "class-validator";
export class AdjustStockDto{
  @IsUUID() productId!:string;
  @IsNumber() @NotEquals(0) quantity!:number;
  @IsString() @MinLength(2) note!:string;
}
