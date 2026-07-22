import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingSyncDto {
  @ApiPropertyOptional({ example: 'hi' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  locationEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  safetyRulesAccepted?: boolean;
}

export class UpdatePrivacyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAge?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowPromo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showInSearch?: boolean;
}

export class UpdateNotificationPrefsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  new_booking_push?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  new_booking_email?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cancellations?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  session_reminder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  safety_alerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  payout_confirm?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  earnings_summary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  news_tips?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  promo_email?: boolean;
}
