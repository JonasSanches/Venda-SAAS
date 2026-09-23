import { IsEmail, IsIn, IsString, MinLength } from "class-validator";
export class LoginDto { @IsString() @MinLength(3) access!: string; @IsString() @MinLength(8) password!: string; }
export class CreateTenantUserDto { @IsString() @MinLength(2) name!:string; @IsString() @MinLength(3) username!:string; @IsString() @MinLength(8) password!:string; @IsIn(["ADMIN","MANAGER","SELLER","CASHIER","STOCK"]) role!:"ADMIN"|"MANAGER"|"SELLER"|"CASHIER"|"STOCK" }
export class UpdateTenantUserRoleDto { @IsIn(["ADMIN","MANAGER","SELLER","CASHIER","STOCK"]) role!:"ADMIN"|"MANAGER"|"SELLER"|"CASHIER"|"STOCK" }
export class ChangePasswordDto { @IsString() @MinLength(8) currentPassword!:string; @IsString() @MinLength(12) newPassword!:string }
