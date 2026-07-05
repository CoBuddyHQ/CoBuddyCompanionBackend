import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsUrl, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SOSTriggerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() sessionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) lng?: number;
}
class SOSResolveDto {
  @ApiProperty() @IsString() sosId: string;
}
class TimerStartDto {
  @ApiProperty({ example: 30 }) @IsNumber() @Min(5) @Max(240) @Type(() => Number) durationMinutes: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sessionId?: string;
}
class AddContactDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsString() relationship: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isEmergencyContact?: boolean;
}
class UpdateContactDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() relationship?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isEmergencyContact?: boolean;
}
class BlockCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
class ReportCustomerDto {
  @ApiProperty() @IsString() reason: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sessionId?: string;
}
class IncidentDto {
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sessionId?: string;
}
class EvidenceDto {
  @ApiProperty({ isArray: true }) @IsArray() @IsString({ each: true }) evidenceUrls: string[];
}

@ApiTags('Safety')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('sos/trigger') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger SOS alert — Endpoints.SAFETY.SOS_TRIGGER' })
  triggerSOS(@CurrentCompanion() c: JwtPayload, @Body() dto: SOSTriggerDto) {
    return this.safetyService.triggerSOS(c.sub, dto.sessionId, dto.lat, dto.lng);
  }

  @Post('sos/resolve') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve SOS — Endpoints.SAFETY.SOS_RESOLVE' })
  resolveSOS(@CurrentCompanion() c: JwtPayload, @Body() dto: SOSResolveDto) {
    return this.safetyService.resolveSOS(c.sub, dto.sosId);
  }

  @Post('timer/start') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start safety timer — Endpoints.SAFETY.TIMER_START' })
  startTimer(@CurrentCompanion() c: JwtPayload, @Body() dto: TimerStartDto) {
    return this.safetyService.startTimer(c.sub, dto.durationMinutes, dto.sessionId);
  }

  @Post('timer/checkin') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Safety timer check-in — Endpoints.SAFETY.TIMER_CHECKIN' })
  checkinTimer(@CurrentCompanion() c: JwtPayload) {
    return this.safetyService.checkinTimer(c.sub);
  }

  @Post('timer/cancel') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel safety timer — Endpoints.SAFETY.TIMER_CANCEL' })
  cancelTimer(@CurrentCompanion() c: JwtPayload) {
    return this.safetyService.cancelTimer(c.sub);
  }

  @Get('trusted-contacts')
  @ApiOperation({ summary: 'Get trusted contacts — Endpoints.SAFETY.TRUSTED_CONTACTS' })
  getTrustedContacts(@CurrentCompanion() c: JwtPayload) {
    return this.safetyService.getTrustedContacts(c.sub);
  }

  @Post('trusted-contacts/add') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add trusted contact — Endpoints.SAFETY.TRUSTED_ADD' })
  addContact(@CurrentCompanion() c: JwtPayload, @Body() dto: AddContactDto) {
    return this.safetyService.addTrustedContact(c.sub, dto);
  }

  @Put('trusted-contacts/:contactId')
  @ApiOperation({ summary: 'Update trusted contact — Endpoints.SAFETY.TRUSTED_UPDATE' })
  updateContact(@CurrentCompanion() c: JwtPayload, @Param('contactId') id: string, @Body() dto: UpdateContactDto) {
    return this.safetyService.updateTrustedContact(c.sub, id, dto);
  }

  @Delete('trusted-contacts/:contactId')
  @ApiOperation({ summary: 'Delete trusted contact — Endpoints.SAFETY.TRUSTED_DELETE' })
  deleteContact(@CurrentCompanion() c: JwtPayload, @Param('contactId') id: string) {
    return this.safetyService.deleteTrustedContact(c.sub, id);
  }

  @Post('block/:customerId') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block customer — Endpoints.SAFETY.BLOCK_CUSTOMER' })
  blockCustomer(@CurrentCompanion() c: JwtPayload, @Param('customerId') cid: string, @Body() dto: BlockCustomerDto) {
    return this.safetyService.blockCustomer(c.sub, cid, dto.reason);
  }

  @Post('report/:customerId') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report customer — Endpoints.SAFETY.REPORT_CUSTOMER' })
  reportCustomer(@CurrentCompanion() c: JwtPayload, @Param('customerId') cid: string, @Body() dto: ReportCustomerDto) {
    return this.safetyService.reportCustomer(c.sub, cid, dto.reason, dto.sessionId);
  }

  @Post('incident') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit incident report — Endpoints.SAFETY.INCIDENT_REPORT' })
  reportIncident(@CurrentCompanion() c: JwtPayload, @Body() dto: IncidentDto) {
    return this.safetyService.reportIncident(c.sub, dto.description, dto.sessionId);
  }

  @Post('incident/:reportId/evidence') @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload incident evidence — Endpoints.SAFETY.INCIDENT_EVIDENCE' })
  uploadEvidence(@CurrentCompanion() c: JwtPayload, @Param('reportId') rid: string, @Body() dto: EvidenceDto) {
    return this.safetyService.uploadEvidence(c.sub, rid, dto.evidenceUrls);
  }
}
