import {
  IsString, IsOptional, IsArray, IsNumber, IsBoolean,
  Min, Max, ArrayMaxSize, IsUrl, IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProfileSetupBulkDto {
  @ApiPropertyOptional({ example: 'I love meaningful conversations...' })
  @IsOptional() @IsString()
  bio?: string;

  @ApiPropertyOptional({ isArray: true, example: ['great_listener', 'art_lover'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  interestTags?: string[];

  @ApiPropertyOptional({ isArray: true, example: ['cafe_conversation', 'city_walk'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ isArray: true, example: ['Hindi', 'English'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  languages?: string[];
}

export class UpdateBasicProfileDto {
  @ApiPropertyOptional({ example: 'Priya' })
  @IsOptional() @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Food Explorer' })
  @IsOptional() @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: 'Female' })
  @IsOptional() @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'I love showing people around...' })
  @IsOptional() @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'Bhopal' })
  @IsOptional() @IsString()
  city?: string;
}

export class UpdateBioDto {
  @ApiPropertyOptional({ example: 'Passionate about meaningful conversations...' })
  @IsOptional() @IsString()
  bio?: string;
}

export class UpdateCategoriesDto {
  @ApiPropertyOptional({ isArray: true, example: ['cafe_conversation', 'city_walk'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  categories?: string[];
}

export class UpdateLanguagesDto {
  @ApiPropertyOptional({ isArray: true, example: ['Hindi', 'English'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  languages?: string[];
}

export class UpdateWorkPreferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  durations?: any;

  @ApiPropertyOptional()
  @IsOptional()
  days?: any;

  @ApiPropertyOptional()
  @IsOptional()
  timeRanges?: any;

  @ApiPropertyOptional()
  @IsOptional()
  frequency?: any;
}


export class UpdateServiceAreasDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ isArray: true })
  @IsOptional() @IsArray() @IsString({ each: true })
  serviceAreas?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  willingToTravel?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  travelRadius?: number;
}

export class UpdatePricingDto {
  @ApiPropertyOptional({ example: 699 })
  @IsOptional() @IsNumber() @Min(0) @Max(99999)
  @Type(() => Number)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional() @IsNumber() @Min(30) @Max(300)
  @Type(() => Number)
  sessionDuration?: number;
}

export class UpdateCommActivityDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  commStyle?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  activityPace?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  groupPreference?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  accessibilityNote?: string;
}

export class UpdateVenuesDto {
  @ApiPropertyOptional({ isArray: true })
  @IsOptional() @IsArray() @IsString({ each: true })
  venuePreferences?: string[];
}

export class UpdateBoundariesDto {
  @ApiProperty()
  @IsBoolean()
  boundariesAccepted: boolean;
}

export class UpdatePhotoDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  photoUrl?: string;
}

export class UpdatePhotosDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ isArray: true })
  @IsOptional() @IsArray() @IsString({ each: true })
  galleryPhotos?: string[];
}

export class ReorderPhotosDto {
  @ApiPropertyOptional({ isArray: true })
  @IsArray() @IsString({ each: true })
  @ArrayMaxSize(9)
  photoIds: string[];
}

export class ToggleAvailabilityDto {
  @ApiPropertyOptional()
  @IsBoolean()
  isAvailable: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isOnline?: boolean;
}
