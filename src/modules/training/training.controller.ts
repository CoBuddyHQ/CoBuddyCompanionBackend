import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Training')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  /** GET /companion/training/modules — Endpoints.TRAINING.MODULES */
  @Get('modules')
  @ApiOperation({ summary: 'Get all training modules with completion status' })
  getModules(@CurrentCompanion() c: JwtPayload) {
    return this.trainingService.getModules(c.sub);
  }

  /** GET /companion/training/modules/:moduleId — Endpoints.TRAINING.MODULE_DETAIL */
  @Get('modules/:moduleId')
  @ApiOperation({ summary: 'Get training module content' })
  getModule(@Param('moduleId') moduleId: string) {
    return this.trainingService.getModule(moduleId);
  }

  /** POST /companion/training/modules/:moduleId/complete — Endpoints.TRAINING.COMPLETE */
  @Post('modules/:moduleId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark training module as completed' })
  completeModule(
    @CurrentCompanion() c: JwtPayload,
    @Param('moduleId') moduleId: string,
    @Body() dto: any,
  ) {
    return this.trainingService.completeModule(c.sub, moduleId, dto?.score);
  }
}
