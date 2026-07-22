import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DayScheduleDto {
  @ApiProperty()
  @IsString()
  day: string;

  @ApiProperty()
  @IsBoolean()
  active: boolean;

  @ApiProperty()
  @IsString()
  times: string;
}

export class UpdateDefaultHoursDto {
  @ApiProperty({ type: [DayScheduleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  hours: DayScheduleDto[];
}

export class AddDateOverrideDto {
  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  endDate: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;

  @ApiProperty()
  @IsBoolean()
  fullDay: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  endTime?: string;
}

export class AddSlotDto {
  @ApiProperty()
  @IsString()
  date: string;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

  @ApiProperty()
  @IsBoolean()
  repeat: boolean;
}

export class UpdateSlotDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  repeat?: boolean;
}

export class VacationModeDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  awayFrom?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  returnOn?: string;
}

export class LiveAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  isAvailable: boolean;
}
