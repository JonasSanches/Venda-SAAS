import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsNumber, IsObject, IsOptional, IsString, Length, Matches, Min, ValidateNested } from "class-validator";

export class CreateProductDto {
  @ApiProperty() @IsString() @Length(1, 64) sku!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Length(4, 64) @Matches(/^[0-9A-Za-z._-]+$/, { message: "Código de barras inválido" }) barcode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsIn(["BOARD_SHORTS_SLIT", "BOARD_SHORTS_STRAIGHT", "TSHIRT_REGULAR", "TANK_TOP"]) designTemplate?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() designData?: Record<string, unknown>;
  @ApiProperty() @IsString() @Length(2, 160) name!: string;
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Length(8, 8) ncm?: string;
}
export class ImportProductDto extends CreateProductDto {
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) quantity!: number;
}
export class ImportProductsDto {
  @ApiProperty({ type: [ImportProductDto] }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each:true }) @Type(()=>ImportProductDto) items!: ImportProductDto[];
}
export class ProductFiscalDto {
  @ApiProperty() @IsString() @Length(8, 8) ncm!: string;
  @ApiProperty({required:false}) @IsOptional() @IsString() cest?: string;
  @ApiProperty() @IsString() @Length(4, 4) cfop!: string;
  @ApiProperty() @IsString() csosn!: string;
  @ApiProperty() @IsString() pisCst!: string;
  @ApiProperty() @IsString() cofinsCst!: string;
}
