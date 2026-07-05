import {
  IsString, IsOptional, IsArray, IsNumber, IsBoolean,
  Min, Max, ArrayMaxSize, IsUrl, IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateBasicProfileDto {
  @ApiPropertyOptional({ example: 'Priya' })
  @IsOptional() @IsString()
  displayName?: string;

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
  @ApiPropertyOptional({ isArray: true, example: ['CAFE_CONVERSATION', 'CITY_WALK'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  categories?: string[];
}

export class UpdateLanguagesDto {
  @ApiPropertyOptional({ isArray: true })
  @IsOptional() @IsArray()
  languages?: { language: string; proficiency?: string }[];
}

export class UpdateServiceAreasDto {
  @ApiPropertyOptional({ isArray: true })
  @IsOptional() @IsArray()
  serviceAreas?: { area: string; city: string }[];
}

export class UpdatePricingDto {
  @ApiPropertyOptional({ example: 699 })
  @IsOptional() @IsNumber() @Min(0) @Max(99999)
  @Type(() => Number)
  hourlyRate?: number;
}

export class UpdatePhotoDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  photoUrl?: string;
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
