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

  /** GET /companion/availability/slots — Endpoints.AVAILABILITY.GET_SLOTS */
  @Get('slots')
  @ApiOperation({ summary: 'Get all slots, blocked times, vacation mode' })
  getSlots(@CurrentCompanion() c: JwtPayload) {
    return this.availabilityService.getSlots(c.sub);
  }

  /** POST /companion/availability/slots/add — Endpoints.AVAILABILITY.ADD_SLOT */
  @Post('slots/add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a time slot' })
  addSlot(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.availabilityService.addSlot(c.sub, dto);
  }

  /** PUT /companion/availability/slots/:slotId — Endpoints.AVAILABILITY.UPDATE_SLOT */
  @Put('slots/:slotId')
  @ApiOperation({ summary: 'Update a specific slot' })
  updateSlot(@CurrentCompanion() c: JwtPayload, @Param('slotId') slotId: string, @Body() dto: any) {
    return this.availabilityService.updateSlot(c.sub, slotId, dto);
  }

  /** DELETE /companion/availability/slots/:slotId — Endpoints.AVAILABILITY.DELETE_SLOT */
  @Delete('slots/:slotId')
  @ApiOperation({ summary: 'Delete a specific slot' })
  deleteSlot(@CurrentCompanion() c: JwtPayload, @Param('slotId') slotId: string) {
    return this.availabilityService.deleteSlot(c.sub, slotId);
  }

  /** POST /companion/availability/recurring/add — Endpoints.AVAILABILITY.ADD_RECURRING */
  @Post('recurring/add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add recurring weekly schedule' })
  addRecurring(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.availabilityService.addRecurring(c.sub, dto);
  }

  /** POST /companion/availability/block — Endpoints.AVAILABILITY.BLOCK_TIME */
  @Post('block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a specific date/time' })
  blockTime(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.availabilityService.blockTime(c.sub, dto);
  }

  /** POST /companion/availability/vacation — Endpoints.AVAILABILITY.VACATION_MODE */
  @Post('vacation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable vacation mode' })
  setVacationMode(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.availabilityService.setVacationMode(c.sub, dto);
  }
}
