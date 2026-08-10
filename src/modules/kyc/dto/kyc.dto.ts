import { IsString, IsOptional, IsDateString, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BasicDetailsDto {
  @ApiPropertyOptional({ example: 'Aditi Sharma' })
  @IsOptional() @IsString()
  legalName?: string;

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

export class SaveDeclarationDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  accurateInfo?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  publicVenueOnly?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  professionalConduct?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  noPrivateContact?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  safetyPolicy?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  noMisrepresentation?: boolean;

  @ApiPropertyOptional({ example: '2023-01-01T00:00:00Z' })
  @IsOptional() @IsString()
  agreedAt?: string;
}

export class UpdateGovernmentIdTypeDto {
  @ApiProperty({ example: 'Aadhaar Card' })
  @IsString()
  documentType: string;
}

export class SubmitGovernmentIdDto {
  @ApiProperty({ example: 'Aadhaar Card' })
  @IsString()
  documentType: string;

  @ApiProperty({ example: 'https://bucket.s3.amazonaws.com/front.jpg' })
  @IsString()
  frontUrl: string;

  @ApiPropertyOptional({ example: 'https://bucket.s3.amazonaws.com/back.jpg' })
  @IsOptional() @IsString()
  backUrl?: string;
}

export class SubmitSelfieDto {
  @ApiProperty({ example: 'https://bucket.s3.amazonaws.com/selfie.jpg' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ example: 'https://bucket.s3.amazonaws.com/liveness.mp4' })
  @IsOptional() @IsString()
  videoUrl?: string;
}

export class SaveAddressDto {
  @ApiProperty({ example: 'House/Flat no., Street, Area' })
  @IsString()
  line1: string;

  @ApiPropertyOptional({ example: 'Landmark, Colony' })
  @IsOptional() @IsString()
  line2?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  state: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  pinCode: string;

  @ApiPropertyOptional({ example: 'current_residence' })
  @IsOptional() @IsString()
  addressType?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  idMatch?: boolean;

  @ApiPropertyOptional({ example: 'Utility bill' })
  @IsOptional() @IsString()
  addressDocumentType?: string;

  @ApiPropertyOptional({ example: 'https://bucket.s3.amazonaws.com/proof.jpg' })
  @IsOptional() @IsString()
  addressDocumentUrl?: string;
}

export class SavePanDto {
  @ApiProperty({ example: 'JOHN DOE' })
  @IsString()
  panName: string;

  @ApiPropertyOptional({ example: 'SEQPS5533K' })
  @IsOptional() @IsString()
  panNumber?: string;

  @ApiPropertyOptional({ example: 'ABCXXXXX34F' })
  @IsOptional() @IsString()
  maskedPan?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional() @IsString()
  taxResidency?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  hasGST?: boolean;

  @ApiPropertyOptional({ example: '22AAAAA0000A1Z5' })
  @IsOptional() @IsString()
  gstNumber?: string;
}

export class SaveBankDto {
  @ApiProperty({ example: 'JOHN DOE' })
  @IsString()
  holderName: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional() @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: '4821' })
  @IsOptional() @IsString()
  maskedAccount?: string;

  @ApiProperty({ example: 'HDFC0001234' })
  @IsString()
  ifsc: string;

  @ApiPropertyOptional({ example: 'savings' })
  @IsOptional() @IsString()
  accountType?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsOptional() @IsString()
  bankName?: string;
}

export class VerifyBankDto {
  @ApiProperty({ example: 'bank-12345678' })
  @IsString()
  bankId: string;
}

export class SaveUpiDto {
  @ApiPropertyOptional({ example: 'rahul@okaxis' })
  @IsOptional() @IsString()
  upiId?: string;

  @ApiPropertyOptional({ example: 'ra••••@okaxis' })
  @IsOptional() @IsString()
  maskedUpi?: string;

  @ApiPropertyOptional({ example: 'My Primary UPI' })
  @IsOptional() @IsString()
  payoutLabel?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isPrimary?: boolean;
}
