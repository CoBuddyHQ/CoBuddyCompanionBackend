import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  IsIn,
} from 'class-validator';

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
  @Min(0.01)
  estimatedEarning!: number;

  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsDateString()
  expiresAt: string;
}

export class ModifyInternalBookingRequestDto {
  @IsOptional()
  @IsDateString()
  proposedStart?: string;

  @IsOptional()
  @IsDateString()
  proposedEnd?: string;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  venueName?: string;

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

  @IsOptional()
  @IsString()
  estimatedEarning?: string;

  @IsOptional()
  @IsString()
  customerNote?: string;
}
