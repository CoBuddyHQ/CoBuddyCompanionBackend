import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { InternalService } from './internal.service';
import { InternalServiceGuard } from './internal-service.guard';
import { CreateInternalBookingRequestDto, InternalCompanionQueryDto } from './dto/internal.dto';

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

  @Get('campaigns')
  @ApiOperation({ summary: 'Internal campaign discovery strictly filtered for active customer view' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  @ApiResponse({ status: 200, description: 'Active customer campaigns' })
  async getCampaigns() {
    return this.internalService.getCampaigns();
  }

  @Post('booking-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create booking request with double-booking 409 prevention' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  @ApiResponse({ status: 201, description: 'Booking request created' })
  @ApiResponse({ status: 409, description: 'Overlapping booking conflict' })
  async createBookingRequest(@Body() dto: CreateInternalBookingRequestDto) {
    return this.internalService.createBookingRequest(dto);
  }

  // Legacy route compatibility for existing internal callers
  @Post('companion/requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Legacy booking request creation endpoint' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  async createLegacyBookingRequest(@Body() dto: CreateInternalBookingRequestDto) {
    return this.internalService.createBookingRequest(dto);
  }
}
