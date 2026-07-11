import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    private toNotificationResponse;
    getNotifications(companionId: string, page?: number, limit?: number): Promise<{
        notifications: {
            notificationId: any;
            type: any;
            title: any;
            body: any;
            isRead: any;
            data: any;
            createdAt: any;
        }[];
        total: number;
        unreadCount: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>;
    markRead(companionId: string, notificationId: string): Promise<{
        message: string;
    }>;
    markAllRead(companionId: string): Promise<{
        message: string;
    }>;
    getUnreadCount(companionId: string): Promise<{
        unreadCount: number;
    }>;
    registerPushToken(companionId: string, token: string, deviceId: string, platform: string): Promise<{
        message: string;
    }>;
    updateNotificationPreferences(companionId: string, preferences: any): Promise<{
        companionId: string;
        preferences: any;
        message: string;
    }>;
    getAnnouncements(companionId: string): Promise<{
        announcements: {
            notificationId: any;
            type: any;
            title: any;
            body: any;
            isRead: any;
            data: any;
            createdAt: any;
        }[];
    }>;
}
