import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
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

  @Get('schedule') @ApiOperation({ summary: 'Get regular schedule' })
  getSchedule(@CurrentCompanion() c: JwtPayload) {
    return this.availabilityService.getSchedule(c.sub);
  }

  @Put('schedule') @ApiOperation({ summary: 'Update regular schedule' })
  updateSchedule(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.availabilityService.updateSchedule(c.sub, dto);
  }

  @Get('holidays') @ApiOperation({ summary: 'Get planned holidays' })
  getHolidays(@CurrentCompanion() c: JwtPayload) {
    return this.availabilityService.getHolidays(c.sub);
  }

  @Put('holidays') @ApiOperation({ summary: 'Update planned holidays' })
  setHolidays(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.availabilityService.setHolidays(c.sub, dto);
  }
}
