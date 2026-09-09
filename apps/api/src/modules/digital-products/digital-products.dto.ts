import { IsEmail, IsIn } from "class-validator";
export class DigitalCheckoutDto{
  @IsEmail()email!:string;
  @IsIn(["PDF","KINDLE"])format!:"PDF"|"KINDLE";
}
