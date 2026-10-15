import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateInternalBookingRequestDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  companionId: string;

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  customerInitials: string;

  @IsOptional()
  @IsNumber()
  customerTrustScore?: number;

  @IsOptional()
  @IsBoolean()
  customerVerified?: boolean;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  venueName: string;

  @IsOptional()
  @IsString()
  venueArea?: string;

  @IsOptional()
  @IsString()
  venueCity?: string;

  @IsOptional()
  @IsString()
  venueType?: string;

  @IsOptional()
  @IsString()
  venueMeetingPoint?: string;

  @IsOptional()
  @IsString()
  venueLandmark?: string;

  @IsDateString()
  proposedStart: string;

  @IsDateString()
  proposedEnd: string;

  @IsNumber()
  durationMinutes: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsNumber()
  estimatedEarning: number;

  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsDateString()
  expiresAt: string;
}
