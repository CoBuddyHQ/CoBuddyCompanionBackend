import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsBoolean, Min, Max, IsIn } from 'class-validator';

export class CreateInternalBookingRequestDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @IsString()
  @IsNotEmpty()
  companionId!: string;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsOptional()
  customerInitials?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  customerTrustScore?: number;

  @IsBoolean()
  customerVerified!: boolean;

  @IsBoolean()
  @IsIn([true])
  customerSafetyConsent!: true;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  venueName!: string;

  @IsString()
  @IsOptional()
  venueArea?: string;

  @IsString()
  @IsOptional()
  venueCity?: string;

  @IsString()
  @IsOptional()
  venueType?: string;

  @IsString()
  @IsOptional()
  venueMeetingPoint?: string;

  @IsString()
  @IsOptional()
  venueLandmark?: string;

  @IsDateString()
  @IsNotEmpty()
  proposedStart!: string;

  @IsDateString()
  @IsNotEmpty()
  proposedEnd!: string;

  @IsNumber()
  @Min(1)
  @Max(480)
  durationMinutes!: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsNumber()
  @Min(0.01)
  estimatedEarning!: number;

  @IsString()
  @IsOptional()
  customerNote?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class InternalCompanionQueryDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class CreateInternalReviewDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsOptional()
  customerInitials?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  highlights?: string[];

  @IsNumber()
  @IsOptional()
  punctuality?: number;

  @IsNumber()
  @IsOptional()
  communication?: number;

  @IsNumber()
  @IsOptional()
  behavior?: number;
}
