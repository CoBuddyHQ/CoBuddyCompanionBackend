"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toNotificationResponse(n) {
        let parsedData = null;
        if (n.data) {
            if (typeof n.data === 'string') {
                try {
                    parsedData = JSON.parse(n.data);
                }
                catch {
                    parsedData = { raw: n.data };
                }
            }
            else {
                parsedData = n.data;
            }
        }
        const category = (n.type || 'system').toLowerCase();
        return {
            notificationId: n.id,
            category,
            type: category,
            priority: 'normal',
            title: n.title,
            body: n.body,
            isRead: n.isRead,
            actionRoute: parsedData?.route ?? null,
            actionParams: parsedData?.params ?? null,
            data: parsedData,
            createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
        };
    }
    async getNotifications(companionId, page = 1, limit = 20) {
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
    async markRead(companionId, notificationId) {
        await this.prisma.notification.updateMany({
            where: { id: notificationId, companionId },
            data: { isRead: true, readAt: new Date() },
        });
        return { message: 'Marked as read' };
    }
    async markAllRead(companionId) {
        await this.prisma.notification.updateMany({
            where: { companionId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { message: 'All notifications marked as read' };
    }
    async getUnreadCount(companionId) {
        const count = await this.prisma.notification.count({
            where: { companionId, isRead: false },
        });
        return { unreadCount: count };
    }
    async registerPushToken(companionId, token, deviceId, platform) {
        await this.prisma.pushToken.upsert({
            where: { companionId_deviceId: { companionId, deviceId } },
            update: { token, platform },
            create: { companionId, token, deviceId, platform },
        });
        return { message: 'Push token registered successfully' };
    }
    async updateNotificationPreferences(companionId, preferences) {
        return { companionId, preferences, message: 'Notification preferences updated' };
    }
    async getAnnouncements(companionId) {
        const announcements = await this.prisma.notification.findMany({
            where: { type: 'system', isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        return {
            announcements: announcements.map(n => this.toNotificationResponse(n)),
        };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map