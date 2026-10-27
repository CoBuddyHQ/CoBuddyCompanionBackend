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
}
