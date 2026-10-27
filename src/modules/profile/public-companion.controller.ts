import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';

@ApiTags('Public Companions Discovery')
@Controller('companions/public')
export class PublicCompanionController {

  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'List approved, verified active companions for customer discovery' })
  getApprovedCompanions(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('gender') gender?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.profileService.getApprovedCompanions({
      city,
      category,
      gender,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile card for a verified companion' })
  getPublicCompanionDetail(@Param('id') id: string) {
    return this.profileService.getPublicCompanionDetail(id);
  }
}
