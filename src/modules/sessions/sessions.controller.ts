import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { IsString, IsOptional, IsNumber, Min, Max, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CheckInDto {}

class VerifyCustomerDto {
  @ApiProperty({ example: 'AR-642' })
  @IsString()
  passCode: string;
}

class ExtendSessionDto {
  @ApiProperty({ example: 60, description: '30–180 minutes' })
  @IsNumber() @Min(30) @Max(180)
  @Type(() => Number)
  extraMinutes: number;
}

class EndEarlyDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  reason?: string;
}

class CancelSessionDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

class SessionNotesDto {
  @ApiProperty()
  @IsString()
  notes: string;
}

class RateCustomerDto {
  @ApiProperty({ example: 5 })
  @IsInt() @Min(1) @Max(5)
  @Type(() => Number)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  feedback?: string;
}

@ApiTags('Sessions')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /** GET /companion/sessions/upcoming — Endpoints.SESSIONS.LIST_UPCOMING */
  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming sessions — returns Session[] from store.types.ts' })
  getUpcoming(@CurrentCompanion() c: JwtPayload) {
    return this.sessionsService.getUpcoming(c.sub);
  }

  /** GET /companion/sessions/history — Endpoints.SESSIONS.LIST_HISTORY */
  @Get('history')
  @ApiOperation({ summary: 'Get session history with pagination' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getHistory(
    @CurrentCompanion() c: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.sessionsService.getHistory(c.sub, Number(page), Number(limit));
  }

  /** GET /companion/sessions/:sessionId — Endpoints.SESSIONS.DETAIL */
  @Get(':sessionId')
  @ApiOperation({ summary: 'Get session details' })
  getSession(@CurrentCompanion() c: JwtPayload, @Param('sessionId') sessionId: string) {
    return this.sessionsService.getSession(c.sub, sessionId);
  }

  /** GET /companion/sessions/:sessionId/pass — Endpoints.SESSIONS.SESSION_PASS */
  @Get(':sessionId/pass')
  @ApiOperation({ summary: 'Get digital session pass' })
  getPass(@CurrentCompanion() c: JwtPayload, @Param('sessionId') sessionId: string) {
    return this.sessionsService.getSessionPass(c.sub, sessionId);
  }

  /** POST /companion/sessions/:sessionId/checkin — Endpoints.SESSIONS.CHECK_IN */
  @Post(':sessionId/checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Companion checks in at venue' })
  checkIn(@CurrentCompanion() c: JwtPayload, @Param('sessionId') sessionId: string) {
    return this.sessionsService.checkIn(c.sub, sessionId);
  }

  /** POST /companion/sessions/:sessionId/verify-customer — Endpoints.SESSIONS.VERIFY_CUSTOMER */
  @Post(':sessionId/verify-customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify customer by pass code — activates session' })
  verifyCustomer(
    @CurrentCompanion() c: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: VerifyCustomerDto,
  ) {
    return this.sessionsService.verifyCustomer(c.sub, sessionId, dto.passCode);
  }

  /** POST /companion/sessions/:sessionId/extend/request — Endpoints.SESSIONS.EXTEND_REQUEST */
  @Post(':sessionId/extend/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request session extension (30–180 min)' })
  requestExtension(
    @CurrentCompanion() c: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: ExtendSessionDto,
  ) {
    return this.sessionsService.requestExtension(c.sub, sessionId, dto.extraMinutes);
  }

  /** POST /companion/sessions/:sessionId/extend/confirm — Endpoints.SESSIONS.EXTEND_CONFIRM */
  @Post(':sessionId/extend/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm session extension after customer approval' })
  confirmExtension(
    @CurrentCompanion() c: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: ExtendSessionDto,
  ) {
    return this.sessionsService.confirmExtension(c.sub, sessionId, dto.extraMinutes);
  }

  /** POST /companion/sessions/:sessionId/end-early — Endpoints.SESSIONS.EARLY_END */
  @Post(':sessionId/end-early')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End session early' })
  endEarly(
    @CurrentCompanion() c: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: EndEarlyDto,
  ) {
    return this.sessionsService.endEarly(c.sub, sessionId, dto.reason);
  }

  /** POST /companion/sessions/:sessionId/cancel — Endpoints.SESSIONS.CANCEL */
  @Post(':sessionId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel upcoming session' })
  cancelSession(
    @CurrentCompanion() c: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: CancelSessionDto,
  ) {
    return this.sessionsService.cancelSession(c.sub, sessionId, dto.reason);
  }

  /** POST /companion/sessions/:sessionId/no-show — Endpoints.SESSIONS.NO_SHOW */
  @Post(':sessionId/no-show')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report customer no-show' })
  reportNoShow(@CurrentCompanion() c: JwtPayload, @Param('sessionId') sessionId: string) {
    return this.sessionsService.reportNoShow(c.sub, sessionId);
  }

  /** POST /companion/sessions/:sessionId/complete — Endpoints.SESSIONS.COMPLETE */
  @Post(':sessionId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark session as completed — triggers earnings transaction' })
  completeSession(@CurrentCompanion() c: JwtPayload, @Param('sessionId') sessionId: string) {
    return this.sessionsService.completeSession(c.sub, sessionId);
  }

  /** POST /companion/sessions/:sessionId/notes — Endpoints.SESSIONS.POST_NOTES */
  @Post(':sessionId/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save post-session notes (private, not visible to customer)' })
  saveNotes(
    @CurrentCompanion() c: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: SessionNotesDto,
  ) {
    return this.sessionsService.saveNotes(c.sub, sessionId, dto.notes);
  }

  /** POST /companion/sessions/:sessionId/rate-customer — Endpoints.SESSIONS.RATE_CUSTOMER */
  @Post(':sessionId/rate-customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rate customer (1–5) after session' })
  rateCustomer(
    @CurrentCompanion() c: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: RateCustomerDto,
  ) {
    return this.sessionsService.rateCustomer(c.sub, sessionId, dto.rating, dto.feedback);
  }
}
