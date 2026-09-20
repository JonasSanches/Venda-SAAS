import { IsEmail, IsIn, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class CreateTransportationLoadDto {
  @IsString() @MinLength(2) loadNumber!: string;
  @IsString() @MinLength(2) brokerName!: string;
  @IsOptional() @IsEmail() brokerEmail?: string;
  @IsOptional() @IsString() brokerPhone?: string;
  @IsOptional() @IsString() origin?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() rateConfirmationNumber?: string;
  @IsOptional() @IsString() rateConfirmationTerms?: string;
  @IsOptional() @IsNumber() @Min(0) rateAmount?: number;
  @IsInt() @Min(0) @Max(10080) detentionFreeMinutes!: number;
  @IsNumber() @Min(0) detentionRatePerHour!: number;
  @IsInt() @Min(0) @Max(10080) detentionMinimumMinutes!: number;
  @IsOptional() @IsString() notes?: string;
}

export class LoadMilestoneDto {
  @IsOptional() @IsISO8601() occurredAt?: string;
}

export class CreateDetentionClaimDto {
  @IsOptional() @IsNumber() @Min(0) requestedAmount?: number;
  @IsOptional() @IsString() currency?: string;
}

export class UpdateClaimStatusDto {
  @IsIn(["DRAFT", "SUBMITTED", "PAID", "DENIED"])
  status!: "DRAFT" | "SUBMITTED" | "PAID" | "DENIED";
  @IsOptional() @IsString() denialReason?: string;
  @IsOptional() @IsString() paymentReference?: string;
}
