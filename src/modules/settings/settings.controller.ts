import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { OnboardingSyncDto, UpdatePrivacyDto, UpdateNotificationPrefsDto } from './dto/settings.dto';

@ApiTags('Settings')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('bank')
  @ApiOperation({ summary: 'Get bank account details' })
  getBankDetails(@CurrentCompanion() c: JwtPayload) {
    return this.settingsService.getBankDetails(c.sub);
  }

  @Post('bank')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update bank details' })
  updateBankDetails(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.settingsService.updateBankDetails(c.sub, dto);
  }

  @Post('pin/change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change security PIN' })
  changePin(@CurrentCompanion() c: JwtPayload, @Body() dto: { currentPin: string; newPin: string }) {
    return this.settingsService.changePin(c.sub, dto);
  }

  @Post('onboarding-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync frontend onboarding data (language, permissions, consent)' })
  onboardingSync(@CurrentCompanion() c: JwtPayload, @Body() dto: OnboardingSyncDto) {
    return this.settingsService.onboardingSync(c.sub, dto);
  }

  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy controls' })
  getPrivacyControls(@CurrentCompanion() c: JwtPayload) {
    return this.settingsService.getPrivacyControls(c.sub);
  }

  @Post('privacy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update privacy controls' })
  updatePrivacyControls(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdatePrivacyDto) {
    return this.settingsService.updatePrivacyControls(c.sub, dto);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification preferences' })
  getNotificationPrefs(@CurrentCompanion() c: JwtPayload) {
    return this.settingsService.getNotificationPrefs(c.sub);
  }

  @Post('notifications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preferences' })
  updateNotificationPrefs(@CurrentCompanion() c: JwtPayload, @Body() dto: UpdateNotificationPrefsDto) {
    return this.settingsService.updateNotificationPrefs(c.sub, dto);
  }

  @Post('data-export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a copy of all companion data' })
  requestDataExport(@CurrentCompanion() c: JwtPayload) {
    return this.settingsService.requestDataExport(c.sub);
  }

  @Post('account/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete companion account' })
  deleteAccount(@CurrentCompanion() c: JwtPayload) {
    return this.settingsService.deleteAccount(c.sub);
  }
}
