import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import {
  CreateInternalBookingRequestDto,
  ModifyInternalBookingRequestDto,
  RespondInternalCounterOfferDto,
} from './dto/internal-booking-request.dto';
import { InternalServiceGuard } from '../../common/guards/internal-service.guard';

@ApiTags('Internal - Requests')
@Controller('internal/companion/requests')
@UseGuards(InternalServiceGuard)
export class InternalRequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Internal service endpoint to create a booking request for a companion',
  })
  @ApiHeader({
    name: 'X-Internal-Service-Key',
    required: true,
    description: 'Internal S2S secret',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking request created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized internal token' })
  async createInternalRequest(@Body() dto: CreateInternalBookingRequestDto) {
    return this.requestsService.createInternalRequest(dto);
  }

  @Patch(':bookingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Synchronize an accepted customer change to a pending request',
  })
  @ApiHeader({
    name: 'X-Internal-Service-Key',
    required: true,
    description: 'Internal S2S secret',
  })
  async modifyInternalRequest(
    @Param('bookingId') bookingId: string,
    @Body() dto: ModifyInternalBookingRequestDto,
  ) {
    return this.requestsService.modifyInternalRequest(bookingId, dto);
  }

  @Post(':bookingId/counter-response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a customer response to a companion counter-offer' })
  @ApiHeader({ name: 'X-Internal-Service-Key', required: true })
  async respondToCounterOffer(
    @Param('bookingId') bookingId: string,
    @Body() dto: RespondInternalCounterOfferDto,
  ) {
    return this.requestsService.respondToCustomerCounterOffer(bookingId, dto.action);
  }
}
