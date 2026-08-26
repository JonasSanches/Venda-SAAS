import { IsIn, IsNumber, IsString, Min, MinLength } from "class-validator";
export class OpenCashDto{ @IsNumber() @Min(0) openingAmount!:number; }
export class CashMovementDto{ @IsIn(["SUPPLY","WITHDRAWAL"]) type!:"SUPPLY"|"WITHDRAWAL"; @IsNumber() @Min(0.01) amount!:number; @IsString() @MinLength(3) note!:string; }
export class CloseCashDto{ @IsNumber() @Min(0) declaredAmount!:number; }
