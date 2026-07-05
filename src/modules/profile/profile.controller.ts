import {
  Controller, Get, Put, Post, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import {
  UpdateBasicProfileDto, UpdateBioDto, UpdateCategoriesDto,
  UpdateLanguagesDto, UpdateServiceAreasDto, UpdatePricingDto,
  ToggleAvailabilityDto, ReorderPhotosDto,
} from './dto/profile.dto';

@ApiTags('Profile')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /** GET /api/v1/companion/profile — Endpoints.PROFILE.GET */
  @Get()
  @ApiOperation({ summary: 'Get companion profile (CompanionProfile interface)' })
  getProfile(@CurrentCompanion() c: JwtPayload) {
    return this.profileService.getProfile(c.sub);
  }

  /** PUT /api/v1/companion/profile/basic — Endpoints.PROFILE.UPDATE_BASIC */
  @Put('basic')
  @ApiOperation({ summary: 'Update basic profile (name, city)' })
  updateBasic(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateBasicProfileDto) {
    return this.profileService.updateBasic(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/bio — Endpoints.PROFILE.UPDATE_BIO */
  @Put('bio')
  @ApiOperation({ summary: 'Update companion bio' })
  updateBio(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateBioDto) {
    return this.profileService.updateBio(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/categories — Endpoints.PROFILE.UPDATE_CATEGORIES */
  @Put('categories')
  @ApiOperation({ summary: 'Update experience categories' })
  updateCategories(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateCategoriesDto) {
    return this.profileService.updateCategories(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/languages — Endpoints.PROFILE.UPDATE_LANGUAGES */
  @Put('languages')
  @ApiOperation({ summary: 'Update languages' })
  updateLanguages(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateLanguagesDto) {
    return this.profileService.updateLanguages(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/service-areas — Endpoints.PROFILE.UPDATE_AREAS */
  @Put('service-areas')
  @ApiOperation({ summary: 'Update service areas' })
  updateServiceAreas(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateServiceAreasDto) {
    return this.profileService.updateServiceAreas(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/pricing — Endpoints.PROFILE.UPDATE_PRICING */
  @Put('pricing')
  @ApiOperation({ summary: 'Update hourly rate' })
  updatePricing(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdatePricingDto) {
    return this.profileService.updatePricing(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/photos/reorder — Endpoints.PROFILE.REORDER_PHOTOS */
  @Put('photos/reorder')
  @ApiOperation({ summary: 'Reorder gallery photos' })
  reorderPhotos(@CurrentCompanion() c: JwtPayload, @Body() dto: ReorderPhotosDto) {
    return this.profileService.reorderPhotos(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/availability — Endpoints.PROFILE.UPDATE_AVAILABILITY_TOGGLE */
  @Put('availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle online/available status' })
  toggleAvailability(@CurrentCompanion() c: JwtPayload, @Body() dto: ToggleAvailabilityDto) {
    return this.profileService.toggleAvailability(c.sub, dto);
  }

  /** POST /api/v1/companion/profile/submit — Endpoints.PROFILE.SUBMIT_FOR_REVIEW */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit profile for admin review' })
  submitForReview(@CurrentCompanion() c: JwtPayload) {
    return this.profileService.submitForReview(c.sub);
  }

  /** GET /api/v1/companion/profile/preview — Endpoints.PROFILE.PREVIEW */
  @Get('preview')
  @ApiOperation({ summary: 'Preview public profile as customers see it' })
  getPreview(@CurrentCompanion() c: JwtPayload) {
    return this.profileService.getPreview(c.sub);
  }
}
