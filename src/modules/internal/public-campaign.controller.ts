import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InternalService } from './internal.service';

@ApiTags('Public Campaigns')
@Controller('campaigns')
export class PublicCampaignController {
  constructor(private readonly internalService: InternalService) {}

  @Get()
  @ApiOperation({ summary: 'Public active marketing campaigns for mobile applications' })
  @ApiResponse({ status: 200, description: 'List of active campaigns' })
  async getCampaigns() {
    return this.internalService.getCampaigns();
  }
}
