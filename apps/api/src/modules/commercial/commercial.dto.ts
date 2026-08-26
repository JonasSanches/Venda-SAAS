import { IsEmail, IsIn, IsInt, IsOptional, IsString, Length, Min, MinLength } from "class-validator";
export class PartyDto{@IsIn(["CUSTOMER","SUPPLIER"])type!:"CUSTOMER"|"SUPPLIER";@IsString()@MinLength(2)name!:string;@IsString()@MinLength(11)document!:string;@IsOptional()@IsEmail()email?:string;@IsOptional()@IsString()phone?:string}
export class FiscalSettingsDto{@IsIn(["SP","RJ"])state!:"SP"|"RJ";@IsString()taxRegime!:string;@IsString()@MinLength(2)stateRegistration!:string;@IsString()@Length(7,7)cityCode!:string;@IsInt()@Min(1)nfeSeries!:number;@IsInt()@Min(1)nfceSeries!:number}
export class IssueDto{@IsString()orderId!:string;@IsIn(["55","65"])model!:"55"|"65"}
