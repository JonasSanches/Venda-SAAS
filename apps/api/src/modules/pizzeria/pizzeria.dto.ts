import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min, ValidateNested } from "class-validator";

export class ModuleStatusDto { @IsBoolean() enabled!: boolean; }
export class PricingRuleDto { @IsEnum(["HIGHEST_PRICE", "AVERAGE", "PROPORTIONAL"] as const) pricingRule!: "HIGHEST_PRICE"|"AVERAGE"|"PROPORTIONAL"; }
export class NamedOptionDto { @IsString() @Length(2, 120) name!: string; }
export class PizzaSizeDto extends NamedOptionDto { @IsInt() @Min(1) @Max(4) maxFlavors!: number; @IsOptional() @IsInt() @Min(1) @Max(30) serves?: number; }
export class ModifierDto extends NamedOptionDto { @IsEnum(["ADDITION", "REMOVAL"] as const) kind!: "ADDITION"|"REMOVAL"; @IsNumber({maxDecimalPlaces:2}) @Min(0) price!: number; }
export class PizzaSizePriceDto { @IsUUID() sizeId!: string; @IsNumber({maxDecimalPlaces:2}) @Min(0) price!: number; }
export class PizzaFlavorPriceDto { @IsUUID() flavorId!: string; @IsNumber({maxDecimalPlaces:2}) @Min(0) price!: number; }
export class CreatePizzaDto {
  @IsString() @Length(2, 64) sku!: string;
  @IsString() @Length(2, 160) name!: string;
  @IsOptional() @IsString() @Length(8, 8) ncm?: string;
  @IsOptional() @IsString() @Length(5, 5) availableFrom?: string;
  @IsOptional() @IsString() @Length(5, 5) availableTo?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>PizzaSizePriceDto) sizes!: PizzaSizePriceDto[];
  @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>PizzaFlavorPriceDto) flavors!: PizzaFlavorPriceDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsUUID("4", {each:true}) modifierIds?: string[];
}
export class PizzaQuoteFlavorDto { @IsUUID() id!: string; @IsNumber({maxDecimalPlaces:4}) @Min(0.01) @Max(1) fraction!: number; }
export class PizzaQuoteDto {
  @IsUUID() pizzaProductId!: string;
  @IsUUID() sizeId!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(4) @ValidateNested({each:true}) @Type(()=>PizzaQuoteFlavorDto) flavors!: PizzaQuoteFlavorDto[];
  @IsOptional() @IsUUID() doughId?: string;
  @IsOptional() @IsUUID() crustId?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsUUID("4", {each:true}) modifierIds?: string[];
}

export class PizzaOrderLineDto extends PizzaQuoteDto {
  @IsInt() @Min(1) @Max(30) quantity!: number;
}
export class CreatePizzaOrderDto {
  @IsEnum(["COUNTER", "PICKUP", "DELIVERY", "TABLE"] as const) serviceType!: "COUNTER"|"PICKUP"|"DELIVERY"|"TABLE";
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsString() @Length(2, 160) customerName?: string;
  @IsOptional() @IsString() @Length(8, 40) customerPhone?: string;
  @IsOptional() @IsString() @Length(4, 600) address?: string;
  @IsOptional() @IsString() @Length(2, 800) notes?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({each:true}) @Type(()=>PizzaOrderLineDto) items!: PizzaOrderLineDto[];
}
export class PizzaOrderStatusDto { @IsEnum(["NEW", "PREPARING", "OVEN", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"] as const) status!: "NEW"|"PREPARING"|"OVEN"|"READY"|"OUT_FOR_DELIVERY"|"COMPLETED"|"CANCELLED"; }
export class PizzaOrderPaymentDto { @IsBoolean() paid!: boolean; }
