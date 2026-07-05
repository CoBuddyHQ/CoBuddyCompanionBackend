import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsNumberString,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Phone number with country code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{9,14}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiPropertyOptional({ example: 'device-uuid-123' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsNumberString()
  @Length(6, 6)
  otp: string;

  @ApiPropertyOptional({ example: 'device-uuid-123' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class SetPinDto {
  @ApiProperty({ example: '1234' })
  @IsNumberString()
  @Length(4, 6)
  pin: string;
}

export class VerifyPinDto {
  @ApiProperty({ example: '1234' })
  @IsNumberString()
  @Length(4, 6)
  pin: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class BiometricEnrollDto {
  @ApiProperty({ example: 'device-uuid-123' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: 'Public key for biometric verification' })
  @IsString()
  @IsNotEmpty()
  publicKey: string;
}

export class LogoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;
}
