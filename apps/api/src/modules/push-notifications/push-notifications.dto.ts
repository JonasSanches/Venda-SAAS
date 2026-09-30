import { IsString, IsUrl, MinLength } from "class-validator";

export class PushSubscriptionDto {
  @IsUrl({ require_tld: false }) endpoint!: string;
  @IsString() @MinLength(8) p256dh!: string;
  @IsString() @MinLength(8) auth!: string;
}
