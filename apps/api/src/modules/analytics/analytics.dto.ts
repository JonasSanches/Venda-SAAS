import{IsInt,IsObject,IsOptional,IsString,Max,MaxLength,Min,MinLength}from"class-validator";
export class VisitDto{
  @IsString()@MaxLength(300)path!:string;
  @IsOptional()@IsString()@MaxLength(1000)referrer?:string;
  @IsOptional()@IsString()@MaxLength(120)language?:string;
  @IsOptional()@IsString()@MaxLength(120)timezone?:string;
  @IsOptional()@IsString()@MaxLength(160)platform?:string;
  @IsOptional()@IsInt()@Min(0)@Max(20000)screenWidth?:number;
  @IsOptional()@IsInt()@Min(0)@Max(20000)screenHeight?:number;
  @IsOptional()@IsInt()@Min(0)@Max(20000)viewportWidth?:number;
  @IsOptional()@IsInt()@Min(0)@Max(20000)viewportHeight?:number;
}
export class SurveyDto{@IsString()@MinLength(2)@MaxLength(160)name!:string;@IsString()@MinLength(2)@MaxLength(200)company!:string;@IsString()@MinLength(3)@MaxLength(200)contact!:string;@IsOptional()@IsString()@MaxLength(20)language?:string;@IsObject()answers!:Record<string,unknown>}
