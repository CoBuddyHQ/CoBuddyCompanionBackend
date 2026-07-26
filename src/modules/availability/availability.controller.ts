import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Availability')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /** GET /companion/availability — Endpoints.AVAILABILITY.GET */
  @Get()
  @ApiOperation({ summary: 'Get full availability state' })
  getAvailability(@CurrentCompanion() c: JwtPayload) {
    return this.availabilityService.getAvailability(c.sub);
  }

  /** PUT /companion/availability/live */
  @Put('live')
  @ApiOperation({ summary: 'Set live availability' })
  setLiveAvailable(@CurrentCompanion() c: JwtPayload, @Body('isAvailable') isAvailable: boolean) {
    return this.availabilityService.setLiveAvailable(c.sub, isAvailable);
  }

  /** PUT /companion/availability/vacation */
  @Put('vacation')
  @ApiOperation({ summary: 'Enable or disable vacation mode' })
  setVacationMode(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.availabilityService.setVacationMode(c.sub, dto);
  }

  /** PUT /companion/availability/weekly/:day/toggle */
  @Put('weekly/:day/toggle')
  @ApiOperation({ summary: 'Toggle day active status' })
  toggleDay(@CurrentCompanion() c: JwtPayload, @Param('day') day: string) {
    return this.availabilityService.toggleDay(c.sub, day);
  }

  /** PUT /companion/availability/weekly/:day/times */
  @Put('weekly/:day/times')
  @ApiOperation({ summary: 'Set day times' })
  setDayTimes(
    @CurrentCompanion() c: JwtPayload,
    @Param('day') day: string,
    @Body() dto: { times?: string; startTime?: string; endTime?: string },
  ) {
    const times = dto.times ?? (dto.startTime && dto.endTime ? `${dto.startTime} - ${dto.endTime}` : '09:00 AM - 06:00 PM');
    return this.availabilityService.setDayTimes(c.sub, day, times);
  }

  /** POST /companion/availability/overrides */
  @Post('overrides')
  @ApiOperation({ summary: 'Add a date override' })
  addOverride(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.availabilityService.addOverride(c.sub, dto);
  }

  /** DELETE /companion/availability/overrides/:id */
  @Delete('overrides/:id')
  @ApiOperation({ summary: 'Remove a date override' })
  removeOverride(@CurrentCompanion() c: JwtPayload, @Param('id') id: string) {
    return this.availabilityService.removeOverride(c.sub, id);
  }

  /** POST /companion/availability/slots */
  @Post('slots')
  @ApiOperation({ summary: 'Add a custom slot' })
  addSlot(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.availabilityService.addSlot(c.sub, dto);
  }

  /** PUT /companion/availability/slots/:id */
  @Put('slots/:id')
  @ApiOperation({ summary: 'Update a custom slot' })
  updateSlot(@CurrentCompanion() c: JwtPayload, @Param('id') id: string, @Body() dto: any) {
    return this.availabilityService.updateSlot(c.sub, id, dto);
  }

  /** DELETE /companion/availability/slots/:id */
  @Delete('slots/:id')
  @ApiOperation({ summary: 'Remove a custom slot' })
  removeSlot(@CurrentCompanion() c: JwtPayload, @Param('id') id: string) {
    return this.availabilityService.removeSlot(c.sub, id);
  }
}
