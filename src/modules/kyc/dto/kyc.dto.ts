import { IsString, IsOptional, IsDateString, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BasicDetailsDto {
  @ApiPropertyOptional({ example: 'Aditi' })
  @IsOptional() @IsString()
  legalFirstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional() @IsString()
  legalLastName?: string;

  @ApiPropertyOptional({ example: 'Adi' })
  @IsOptional() @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'aditi@example.com' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1995-08-15T00:00:00.000Z' })
  @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Female' })
  @IsOptional() @IsString()
  gender?: string;
}
