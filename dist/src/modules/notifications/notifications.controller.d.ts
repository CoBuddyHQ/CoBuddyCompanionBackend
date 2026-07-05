import { NotificationsService } from './notifications.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(c: JwtPayload, page?: number, limit?: number): Promise<{
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
    getUnreadCount(c: JwtPayload): Promise<{
        unreadCount: number;
    }>;
    markAllRead(c: JwtPayload): Promise<{
        message: string;
    }>;
    markRead(c: JwtPayload, id: string): Promise<{
        message: string;
    }>;
    registerPushToken(c: JwtPayload, dto: any): Promise<{
        message: string;
    }>;
    updatePreferences(c: JwtPayload, dto: any): Promise<{
        companionId: string;
        preferences: any;
        message: string;
    }>;
}
