import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Returns Notification[] matching store.types.ts Notification interface
  private toNotificationResponse(n: any) {
    return {
      notificationId: n.id,
      type: n.type.toLowerCase(),
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      data: n.data ? JSON.parse(n.data) : null,
      createdAt: n.createdAt.toISOString(),
    };
  }

  async getNotifications(companionId: string, page = 1, limit = 20) {
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { companionId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { companionId } }),
      this.prisma.notification.count({ where: { companionId, isRead: false } }),
    ]);
    return {
      notifications: notifications.map(n => this.toNotificationResponse(n)),
      total,
      unreadCount,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async markRead(companionId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, companionId },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'Marked as read' };
  }

  async markAllRead(companionId: string) {
    await this.prisma.notification.updateMany({
      where: { companionId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(companionId: string) {
    const count = await this.prisma.notification.count({
      where: { companionId, isRead: false },
    });
    return { unreadCount: count };
  }

  async registerPushToken(companionId: string, token: string, deviceId: string, platform: string) {
    await this.prisma.pushToken.upsert({
      where: { companionId_deviceId: { companionId, deviceId } },
      update: { token, platform },
      create: { companionId, token, deviceId, platform },
    });
    return { message: 'Push token registered successfully' };
  }

  async updateNotificationPreferences(companionId: string, preferences: any) {
    return { companionId, preferences, message: 'Notification preferences updated' };
  }

  // ─── Missing Endpoint from Audit ───────────────────────────────────────────
  async getAnnouncements(companionId: string) {
    // Return system-wide announcements
    const announcements = await this.prisma.notification.findMany({
      where: { type: 'SYSTEM_MESSAGE', isRead: false }, // Simplification for mock
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return {
      announcements: announcements.map(n => this.toNotificationResponse(n)),
    };
  }
}
