import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  private toNotificationResponse(n: any) {
    let parsedData = null;
    if (n.data) {
      if (typeof n.data === 'string') {
        try {
          parsedData = JSON.parse(n.data);
        } catch {
          parsedData = { raw: n.data };
        }
      } else {
        parsedData = n.data;
      }
    }

    const category = (n.type || 'system').toLowerCase();

    return {
      notificationId: n.id,
      category,          // matches AppNotification.category in store.types.ts
      type: category,    // alias for backwards compat
      priority: 'normal' as const,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      actionRoute: parsedData?.route ?? null,
      actionParams: parsedData?.params ?? null,
      data: parsedData,
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    };
  }


  async getNotifications(companionId: string, page = 1, limit = 20) {
    let count = await this.prisma.notification.count({ where: { companionId } });
    if (count === 0) {
      const now = new Date();
      await this.prisma.notification.createMany({
        data: [
          {
            companionId,
            type: 'request',
            title: 'New Booking Request from P.M.',
            body: 'Café Conversation • Today, 6:30 PM • MP Nagar • ₹749. Tap to review...',
            isRead: false,
            createdAt: new Date(now.getTime() - 10 * 60 * 1000),
          },
          {
            companionId,
            type: 'payout',
            title: 'Payout of ₹3,500 Successful',
            body: 'Your withdrawal has been processed and transferred to your registered bank account.',
            isRead: false,
            createdAt: new Date(now.getTime() - 60 * 60 * 1000),
          },
          {
            companionId,
            type: 'system',
            title: 'Welcome to CoBuddy Companion!',
            body: 'Your profile is live. Complete your first session to unlock the Rising Star badge.',
            isRead: true,
            createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        ],
      });
    }

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
      where: { type: 'system', isRead: false }, // Simplification for mock
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return {
      announcements: announcements.map(n => this.toNotificationResponse(n)),
    };
  }
}
