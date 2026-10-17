import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateInternalBookingRequestDto } from './dto/internal-booking-request.dto';
import { InternalServiceGuard } from '../../common/guards/internal-service.guard';

@ApiTags('Internal - Requests')
@Controller('internal/companion/requests')
@UseGuards(InternalServiceGuard)
export class InternalRequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Internal service endpoint to create a booking request for a companion' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true, description: 'Internal S2S secret' })
  @ApiResponse({ status: 201, description: 'Booking request created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized internal token' })
  async createInternalRequest(@Body() dto: CreateInternalBookingRequestDto) {
    return this.requestsService.createInternalRequest(dto);
  }
}
