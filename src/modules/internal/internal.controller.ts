import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { InternalServiceGuard } from '../../common/guards/internal-service.guard';
import { InternalService } from './internal.service';
import { InternalCompanionQueryDto, CreateInternalReviewDto } from './dto/internal.dto';

@ApiTags('Internal - S2S Platform Bridge')
@Controller('internal')
@UseGuards(InternalServiceGuard)
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Get('companions')
  @ApiOperation({ summary: 'Internal discovery of active, verified, published companions' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  @ApiResponse({ status: 200, description: 'List of public-safe companion profiles' })
  @ApiResponse({ status: 401, description: 'Unauthorized S2S key' })
  async getCompanions(@Query() query: InternalCompanionQueryDto) {
    return this.internalService.getCompanions(query);
  }

  @Get('companions/:id')
  @ApiOperation({ summary: 'Internal fetch of companion profile by ID' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  @ApiResponse({ status: 200, description: 'Public-safe companion profile' })
  @ApiResponse({ status: 404, description: 'Companion not found' })
  async getCompanionById(@Param('id') id: string) {
    return this.internalService.getCompanionById(id);
  }

  @Post('companions/:id/reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Internal creation and sync of customer review for a companion' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  async createReview(
    @Param('id') companionId: string,
    @Body() dto: CreateInternalReviewDto,
  ) {
    return this.internalService.createInternalReview(companionId, dto);
  }

  @Post('sessions/:bookingId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal S2S completion of a session by booking ID' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  async completeSession(
    @Param('bookingId') bookingId: string,
    @Body() body?: { tip?: number; notes?: string },
  ) {
    return this.internalService.completeSessionByBooking(bookingId, body);
  }

  @Post('sessions/:bookingId/extend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal S2S extension of a session by booking ID' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  async extendSession(
    @Param('bookingId') bookingId: string,
    @Body() body: { extraMinutes: number },
  ) {
    return this.internalService.extendSessionByBooking(bookingId, body?.extraMinutes || 30);
  }

  @Post('companions/:id/verification-decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal S2S verification decision from Admin' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  async updateVerificationDecision(
    @Param('id') companionId: string,
    @Body() body: { status: 'approved' | 'rejected'; reason?: string },
  ) {
    return this.internalService.updateVerificationDecision(companionId, body);
  }

  @Post('companions/:id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal S2S ban/unban companion from Admin' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  async updateBanStatus(
    @Param('id') companionId: string,
    @Body() body: { isBanned: boolean; reason?: string },
  ) {
    return this.internalService.updateBanStatus(companionId, body);
  }
}
