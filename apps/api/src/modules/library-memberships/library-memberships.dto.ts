import { IsEmail, IsString, MinLength } from "class-validator";

export class LibraryMembershipCheckoutDto{
  @IsEmail()email!:string;
  @IsString()@MinLength(8)password!:string;
}

export class LibraryMembershipLoginDto{
  @IsEmail()email!:string;
  @IsString()@MinLength(1)password!:string;
}
