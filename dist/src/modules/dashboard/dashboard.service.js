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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardData(companionId) {
        const [companion, activeSessions, upcomingSessions, pendingRequests, unreadNotifs] = await Promise.all([
            this.prisma.companion.findUnique({ where: { id: companionId } }),
            this.prisma.session.findMany({ where: { companionId, status: 'active' }, take: 1 }),
            this.prisma.session.findMany({
                where: { companionId, status: { in: ['upcoming', 'pre_arrival'] } },
                orderBy: { scheduledStart: 'asc' },
                take: 3,
            }),
            this.prisma.bookingRequest.findMany({
                where: { companionId, status: 'pending' },
                orderBy: { receivedAt: 'desc' },
            }),
            this.prisma.notification.count({ where: { companionId, isRead: false } }),
        ]);
        if (!companion)
            throw new common_1.NotFoundException('Companion not found');
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTxs = await this.prisma.earningsTransaction.findMany({
            where: {
                companionId,
                createdAt: { gte: monthStart },
                type: { in: ['session_earning', 'extension_earning', 'safety_bonus'] },
                status: { not: 'on_hold' },
            },
        });
        const totalEarnedThisMonth = monthTxs.reduce((sum, t) => sum + Math.max(0, Number(t.amount)), 0);
        return {
            companion: {
                companionId: companion.id,
                displayName: companion.displayName,
                profileStatus: companion.profileStatus.toLowerCase(),
                verificationStatus: companion.verificationStatus.toLowerCase(),
                isAvailable: companion.isAvailable,
                trustScore: companion.trustScore,
                trustLevel: companion.trustLevel.toLowerCase(),
                photoUrl: companion.photoUrl,
            },
            stats: {
                totalEarnedThisMonth,
                unreadNotificationsCount: unreadNotifs,
                pendingRequestsCount: pendingRequests.length,
            },
            activeSession: activeSessions[0] ? this.toSessionPreview(activeSessions[0]) : null,
            upcomingSessions: upcomingSessions.map(s => this.toSessionPreview(s)),
            recentRequests: pendingRequests.slice(0, 3).map(r => this.toRequestPreview(r)),
        };
    }
    toSessionPreview(s) {
        return {
            sessionId: s.id,
            status: s.status.toLowerCase(),
            category: s.category.toLowerCase(),
            customerInitials: s.customerInitials,
            scheduledStart: s.scheduledStart.toISOString(),
            venueName: s.venueName,
        };
    }
    toRequestPreview(r) {
        return {
            requestId: r.id,
            category: r.category.toLowerCase(),
            customerInitials: r.customerInitials,
            proposedStart: r.proposedStart.toISOString(),
            estimatedEarning: Number(r.estimatedEarning),
            venueArea: r.venueArea,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map