import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Notifications')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /companion/notifications — Endpoints.NOTIFICATIONS.LIST */
  @Get()
  @ApiOperation({ summary: 'Get notifications — returns Notification[]' })
  getNotifications(
    @CurrentCompanion() c: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.getNotifications(c.sub, Number(page), Number(limit));
  }

  /** GET /companion/notifications/unread-count — Endpoints.NOTIFICATIONS.UNREAD_COUNT */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentCompanion() c: JwtPayload) {
    return this.notificationsService.getUnreadCount(c.sub);
  }

  /** POST /companion/notifications/mark-all-read — Endpoints.NOTIFICATIONS.MARK_ALL_READ */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentCompanion() c: JwtPayload) {
    return this.notificationsService.markAllRead(c.sub);
  }

  /** PATCH /companion/notifications/:notificationId/read — Endpoints.NOTIFICATIONS.MARK_READ */
  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark single notification as read' })
  markRead(@CurrentCompanion() c: JwtPayload, @Param('notificationId') id: string) {
    return this.notificationsService.markRead(c.sub, id);
  }

  /** POST /companion/notifications/push-token — Endpoints.NOTIFICATIONS.PUSH_TOKEN */
  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register FCM push token' })
  registerPushToken(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.notificationsService.registerPushToken(c.sub, dto.token, dto.deviceId, dto.platform);
  }

  /** PUT /companion/notifications/preferences — Endpoints.NOTIFICATIONS.PREFERENCES */
  @Post('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preferences' })
  updatePreferences(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.notificationsService.updateNotificationPreferences(c.sub, dto);
  }
}
