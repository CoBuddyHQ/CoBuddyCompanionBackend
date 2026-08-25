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
  ToggleAvailabilityDto, ReorderPhotosDto, ProfileSetupBulkDto,
  UpdatePhotoDto, UpdatePhotosDto, UpdateWorkPreferenceDto,
  UpdateCommActivityDto, UpdateInterestsDto, UpdateVenuesDto, UpdateBoundariesDto,
} from './dto/profile.dto';

@ApiTags('Profile')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /** PUT /api/v1/companion/profile/interests */
  @Put('interests')
  @ApiOperation({ summary: 'Update companion interest tags' })
  updateInterests(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateInterestsDto) {
    return this.profileService.updateInterests(c.sub, dto);
  }

  /** POST /api/v1/companion/profile/interests */
  @Post('interests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update companion interest tags (POST alias)' })
  updateInterestsPost(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateInterestsDto) {
    return this.profileService.updateInterests(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/photo — Endpoints.PROFILE.UPDATE_PHOTO */
  @Put('photo')
  @ApiOperation({ summary: 'Update primary profile photo' })
  updatePhoto(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdatePhotoDto) {
    return this.profileService.updatePhoto(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/photos — Endpoints.PROFILE.UPDATE_PHOTOS */
  @Put('photos')
  @ApiOperation({ summary: 'Update gallery photos and/or primary photo' })
  updatePhotos(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdatePhotosDto) {
    return this.profileService.updatePhotos(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/work-preference */
  @Put('work-preference')
  @ApiOperation({ summary: 'Update work preference' })
  updateWorkPreference(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateWorkPreferenceDto) {
    return this.profileService.updateWorkPreference(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/comm-activity */
  @Put('comm-activity')
  @ApiOperation({ summary: 'Update communication and activity preferences' })
  updateCommActivity(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateCommActivityDto) {
    return this.profileService.updateCommActivity(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/venues */
  @Put('venues')
  @ApiOperation({ summary: 'Update public venue preferences' })
  updateVenues(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateVenuesDto) {
    return this.profileService.updateVenues(c.sub, dto);
  }

  /** PUT /api/v1/companion/profile/boundaries */
  @Put('boundaries')
  @ApiOperation({ summary: 'Update boundaries and safety acceptance' })
  updateBoundaries(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateBoundariesDto) {
    return this.profileService.updateBoundaries(c.sub, dto);
  }

  /** POST /api/v1/companion/profile/setup-bulk — Endpoints.PROFILE.SETUP_BULK */
  @Post('setup-bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save bio, interests, categories, and languages in one bulk request' })
  setupBulk(@CurrentCompanion() c: JwtPayload, @Body() dto: ProfileSetupBulkDto) {
    return this.profileService.setupBulk(c.sub, dto);
  }

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

  @Get('preview')
  @ApiOperation({ summary: 'Preview public profile as customers see it' })
  getPreview(@CurrentCompanion() c: JwtPayload) {
    return this.profileService.getPreview(c.sub);
  }

  /** GET /api/v1/companion/profile/trust — Trust Score Dashboard */
  @Get('trust')
  @ApiOperation({ summary: 'Get trust score dashboard data' })
  getTrustDashboard(@CurrentCompanion() c: JwtPayload) {
    return this.profileService.getTrustDashboard(c.sub);
  }

  /** POST /api/v1/companion/profile/trust/task — Complete Trust Task */
  @Post('trust/task')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a trust task as completed and update score' })
  completeTrustTask(@CurrentCompanion() c: JwtPayload, @Body() dto: { taskId: string; points: number }) {
    return this.profileService.completeTrustTask(c.sub, dto);
  }
}
