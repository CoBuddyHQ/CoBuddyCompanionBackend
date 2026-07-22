import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DeclineRequestDto {
  @ApiProperty() @IsString() reason: string;
}
class CounterProposeDto {
  @ApiProperty() @IsDateString() newStart: string;
  @ApiProperty() @IsDateString() newEnd: string;
}

@ApiTags('Requests')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  /** GET /companion/requests — Endpoints.REQUESTS.LIST */
  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'pending', 'expired', 'counter_proposed'] })
  @ApiQuery({ name: 'categories', required: false, description: 'Comma separated string of categories' })
  @ApiQuery({ name: 'minEarning', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['newest', 'expiring_soon', 'highest_earning'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiOperation({ summary: 'Get booking requests inbox — returns BookingRequest[]' })
  getRequests(
    @CurrentCompanion() c: JwtPayload,
    @Query('status') status?: string,
    @Query('categories') categories?: string,
    @Query('minEarning') minEarning?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.requestsService.getRequests(
      c.sub, 
      status, 
      categories, 
      minEarning ? Number(minEarning) : undefined, 
      sortBy, 
      Number(page), 
      Number(limit)
    );
  }

  /** GET /companion/requests/:requestId — Endpoints.REQUESTS.DETAIL */
  @Get(':requestId')
  @ApiOperation({ summary: 'Get booking request detail' })
  getRequest(@CurrentCompanion() c: JwtPayload, @Param('requestId') requestId: string) {
    return this.requestsService.getRequest(c.sub, requestId);
  }

  /** GET /companion/requests/:requestId/customer-trust — Endpoints.REQUESTS.CUSTOMER_TRUST */
  @Get(':requestId/customer-trust')
  @ApiOperation({ summary: 'Get customer trust snapshot' })
  getCustomerTrust(@CurrentCompanion() c: JwtPayload, @Param('requestId') requestId: string) {
    return this.requestsService.getCustomerTrust(c.sub, requestId);
  }

  /** POST /companion/requests/:requestId/accept — Endpoints.REQUESTS.ACCEPT */
  @Post(':requestId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept booking request — creates session' })
  acceptRequest(@CurrentCompanion() c: JwtPayload, @Param('requestId') requestId: string) {
    return this.requestsService.acceptRequest(c.sub, requestId);
  }

  /** POST /companion/requests/:requestId/decline — Endpoints.REQUESTS.DECLINE */
  @Post(':requestId/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline booking request' })
  declineRequest(
    @CurrentCompanion() c: JwtPayload,
    @Param('requestId') requestId: string,
    @Body() dto: DeclineRequestDto,
  ) {
    return this.requestsService.declineRequest(c.sub, requestId, dto.reason);
  }

  /** POST /companion/requests/:requestId/counter — Endpoints.REQUESTS.COUNTER_PROPOSE */
  @Post(':requestId/counter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Counter-propose a different time' })
  counterPropose(
    @CurrentCompanion() c: JwtPayload,
    @Param('requestId') requestId: string,
    @Body() dto: CounterProposeDto,
  ) {
    return this.requestsService.counterPropose(c.sub, requestId, dto.newStart, dto.newEnd);
  }
}
