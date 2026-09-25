import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateVideoTranscriptDto {
  @IsUrl({ require_tld: true })
  @MaxLength(2_000)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @IsBoolean()
  authorized!: boolean;
}
