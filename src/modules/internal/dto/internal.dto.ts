import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

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
  @IsOptional()
  customerTrustScore?: number;

  @IsBoolean()
  @IsOptional()
  customerVerified?: boolean;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  venueName?: string;

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
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsNumber()
  @IsOptional()
  estimatedEarning?: number;

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
