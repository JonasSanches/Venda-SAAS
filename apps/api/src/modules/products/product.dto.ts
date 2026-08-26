import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Length, Min } from "class-validator";

export class CreateProductDto {
  @ApiProperty() @IsString() @Length(1, 64) sku!: string;
  @ApiProperty() @IsString() @Length(2, 160) name!: string;
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Length(8, 8) ncm?: string;
}
export class ProductFiscalDto {
  @ApiProperty() @IsString() @Length(8, 8) ncm!: string;
  @ApiProperty({required:false}) @IsOptional() @IsString() cest?: string;
  @ApiProperty() @IsString() @Length(4, 4) cfop!: string;
  @ApiProperty() @IsString() csosn!: string;
  @ApiProperty() @IsString() pisCst!: string;
  @ApiProperty() @IsString() cofinsCst!: string;
}
