import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsString, Length, Matches, ValidateNested } from "class-validator";

export class OrderUnitDto {
  @IsString() @Length(1, 80) @Matches(/\S/) name!: string;
  @IsString() @Matches(/^(?:\d{10,11}|55\d{10,11})$/, { message: "Informe o WhatsApp com DDD, somente números, e opcionalmente o código 55" }) phone!: string;
}
export class OrderSettingsDto {
  @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => OrderUnitDto) units!: OrderUnitDto[];
  @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) @Length(1, 80, { each: true }) @Matches(/\S/, { each: true }) sellers!: string[];
}
