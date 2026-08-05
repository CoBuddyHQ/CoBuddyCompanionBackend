import { Controller, Get, Put, Post, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Account & Settings')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /** GET /companion/account/settings — Endpoints.ACCOUNT.SETTINGS */
  @Get('settings')
  @ApiOperation({ summary: 'Get full account settings and preferences' })
  getSettings(@CurrentCompanion() c: JwtPayload) {
    return this.accountService.getAccountSettings(c.sub);
  }

  /** PUT /companion/account/notification-preferences — Endpoints.ACCOUNT.NOTIFICATION_PREFS */
  @Put('notification-preferences')
  @ApiOperation({ summary: 'Update push/email notification preferences' })
  updateNotificationPrefs(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.accountService.updateNotificationPrefs(c.sub, dto.prefs || dto);
  }

  /** PUT /companion/account/privacy — Endpoints.ACCOUNT.PRIVACY_CONTROLS */
  @Put('privacy')
  @ApiOperation({ summary: 'Update privacy controls' })
  updatePrivacy(@CurrentCompanion() c: JwtPayload, @Body() dto: { visibility: string; dataSharing: boolean }) {
    return this.accountService.updatePrivacy(c.sub, dto);
  }

  /** PUT /companion/account/language — Endpoints.ACCOUNT.LANGUAGE */
  @Put('language')
  @ApiOperation({ summary: 'Update app language setting' })
  updateLanguage(@CurrentCompanion() c: JwtPayload, @Body() dto: { language: string }) {
    return this.accountService.updateLanguage(c.sub, dto);
  }

  /** POST /companion/account/deactivate — Endpoints.ACCOUNT.DEACTIVATE */
  @Post('deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Temporarily deactivate account' })
  deactivateAccount(@CurrentCompanion() c: JwtPayload, @Body() dto: { reason?: string }) {
    return this.accountService.deactivateAccount(c.sub, dto);
  }

  /** POST /companion/account/reactivate — Endpoints.ACCOUNT.REACTIVATE */
  @Post('reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request account reactivation' })
  reactivateAccount(@CurrentCompanion() c: JwtPayload) {
    return this.accountService.reactivateAccount(c.sub);
  }

  /** DELETE /companion/account/delete — Endpoints.ACCOUNT.DELETE */
  @Delete('delete')
  @ApiOperation({ summary: 'Permanently delete account' })
  deleteAccount(@CurrentCompanion() c: JwtPayload, @Body() dto: { reason?: string; confirmation: boolean }) {
    return this.accountService.deleteAccount(c.sub, dto);
  }

  /** GET/POST /companion/account/data-export — Endpoints.ACCOUNT.DATA_EXPORT */
  @Get('data-export')
  @Post('data-export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request data export download link' })
  exportData(@CurrentCompanion() c: JwtPayload) {
    return this.accountService.exportData(c.sub);
  }
}
