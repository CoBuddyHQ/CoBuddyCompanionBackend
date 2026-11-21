import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MasterDataService } from './master-data.service';

@ApiTags('Master Data')
@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get()
  @ApiOperation({ summary: 'Get live Admin master data bundle (cities, categories, languages, etc.)' })
  @ApiResponse({ status: 200, description: 'Master data bundle returned successfully' })
  async getBundle(@Query('refresh') refresh?: string) {
    return this.masterDataService.getBundle(refresh === 'true' || refresh === '1');
  }
}

@ApiTags('Public - Master Data')
@Controller('companions/public/master-data')
export class PublicMasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get()
  @ApiOperation({ summary: 'Get live Admin master data bundle for companions' })
  @ApiResponse({ status: 200, description: 'Master data bundle returned successfully' })
  async getBundle(@Query('refresh') refresh?: string) {
    return this.masterDataService.getBundle(refresh === 'true' || refresh === '1');
  }
}
