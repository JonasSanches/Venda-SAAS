import { IsEmail, IsIn, IsString, MinLength } from "class-validator";
export class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; }
export class CreateTenantUserDto { @IsString() @MinLength(2) name!:string; @IsEmail() email!:string; @IsString() @MinLength(8) password!:string; @IsIn(["ADMIN","MANAGER","CASHIER","STOCK"]) role!:"ADMIN"|"MANAGER"|"CASHIER"|"STOCK" }
