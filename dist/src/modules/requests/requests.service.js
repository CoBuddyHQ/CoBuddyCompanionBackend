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
var RequestsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
let RequestsService = RequestsService_1 = class RequestsService {
    constructor(prisma, notificationsGateway) {
        this.prisma = prisma;
        this.notificationsGateway = notificationsGateway;
        this.logger = new common_1.Logger(RequestsService_1.name);
    }
    toRequestResponse(r) {
        return {
            requestId: r.id,
            status: r.status.toLowerCase(),
            category: r.category.toLowerCase(),
            customer: {
                customerId: r.customerId,
                displayInitials: r.customerInitials,
                trustScore: r.customerTrustScore,
                isVerified: r.customerVerified,
                totalSessionsWithCompanion: r.customerSessionCount,
                sessionCountOverall: r.customerSessionCount,
                safetyConsent: r.customerSafetyConsent,
                identityVerified: r.customerIdentityVerified,
            },
            venue: {
                venueId: r.venueId ?? r.id,
                name: r.venueName,
                area: r.venueArea,
                city: r.venueCity,
                isApproved: r.isVenueApproved,
                venueType: r.venueType,
                meetingPoint: r.venueMeetingPoint,
                landmark: r.venueLandmark,
            },
            proposedStart: r.proposedStart.toISOString(),
            proposedEnd: r.proposedEnd.toISOString(),
            durationMinutes: r.durationMinutes,
            language: r.language,
            estimatedEarning: Number(r.estimatedEarning),
            matchScore: r.matchScore,
            expiresAt: r.expiresAt.toISOString(),
            customerNote: r.customerNote ?? null,
            receivedAt: r.receivedAt.toISOString(),
        };
    }
    async getRequests(companionId, status, categories, minEarning, sortBy, page = 1, limit = 20) {
        const realCount = await this.prisma.bookingRequest.count({
            where: { companionId, NOT: { customerId: { startsWith: 'cust_seed_' } } },
        });
        const totalCount = await this.prisma.bookingRequest.count({ where: { companionId } });
        if (totalCount === 0 && realCount === 0) {
            const now = new Date();
            await this.prisma.bookingRequest.createMany({
                data: [
                    {
                        companionId,
                        customerId: 'cust_seed_1',
                        status: 'pending',
                        category: 'cafe_conversation',
                        customerInitials: 'PM',
                        customerTrustScore: 94,
                        customerVerified: true,
                        customerSafetyConsent: true,
                        customerIdentityVerified: true,
                        venueName: 'Café Coffee Day - MP Nagar',
                        venueArea: 'MP Nagar',
                        venueCity: 'Bhopal',
                        proposedStart: new Date(now.getTime() + 3600000 * 2),
                        proposedEnd: new Date(now.getTime() + 3600000 * 4),
                        durationMinutes: 120,
                        estimatedEarning: 1299.0,
                        matchScore: 94,
                        customerNote: 'Looking forward to exploring the city!',
                        expiresAt: new Date(now.getTime() + 3600000 * 23),
                    },
                    {
                        companionId,
                        customerId: 'cust_seed_2',
                        status: 'pending',
                        category: 'city_walk',
                        customerInitials: 'RK',
                        customerTrustScore: 88,
                        customerVerified: true,
                        customerSafetyConsent: true,
                        customerIdentityVerified: true,
                        venueName: 'DB Mall',
                        venueArea: 'Arera Hills',
                        venueCity: 'Bhopal',
                        proposedStart: new Date(now.getTime() + 3600000 * 5),
                        proposedEnd: new Date(now.getTime() + 3600000 * 6.5),
                        durationMinutes: 90,
                        estimatedEarning: 1099.0,
                        matchScore: 88,
                        expiresAt: new Date(now.getTime() + 3600000 * 20),
                    },
                ],
            });
        }
        const where = { companionId };
        if (status && status !== 'all') {
            where.status = status.toLowerCase();
        }
        else {
            where.status = { in: ['pending', 'expired', 'counter_proposed'] };
        }
        if (categories) {
            const catsArray = categories.split(',').map(c => c.trim().toLowerCase());
            if (catsArray.length > 0) {
                where.category = { in: catsArray };
            }
        }
        let orderBy = { receivedAt: 'desc' };
        if (sortBy === 'newest') {
            orderBy = { receivedAt: 'desc' };
        }
        else if (sortBy === 'expiring_soon') {
            orderBy = { expiresAt: 'asc' };
        }
        else if (sortBy === 'highest_earning') {
            orderBy = { estimatedEarning: 'desc' };
        }
        const [requests, total] = await Promise.all([
            this.prisma.bookingRequest.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.bookingRequest.count({ where }),
        ]);
        const now = new Date();
        await this.prisma.bookingRequest.updateMany({
            where: { companionId, status: 'pending', expiresAt: { lt: now } },
            data: { status: 'expired' },
        });
        const unreadCount = await this.prisma.bookingRequest.count({
            where: { companionId, status: 'pending' },
        });
        return {
            requests: requests.map(r => this.toRequestResponse(r)),
            total,
            unreadCount,
            page,
            limit,
        };
    }
    async getRequest(companionId, requestId) {
        const req = await this.prisma.bookingRequest.findFirst({
            where: { id: requestId, companionId },
        });
        if (!req)
            throw new common_1.NotFoundException('Booking request not found');
        return this.toRequestResponse(req);
    }
    async getCustomerTrust(companionId, requestId) {
        const req = await this.prisma.bookingRequest.findFirst({
            where: { id: requestId, companionId },
        });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        return {
            customerId: req.customerId,
            displayInitials: req.customerInitials,
            trustScore: req.customerTrustScore,
            isVerified: req.customerVerified,
            identityVerified: req.customerIdentityVerified,
            safetyConsent: req.customerSafetyConsent,
            sessionCountOverall: req.customerSessionCount,
            trustBreakdown: {
                identityScore: req.customerIdentityVerified ? 40 : 0,
                safetyScore: req.customerSafetyConsent ? 30 : 0,
                historyScore: Math.min(30, req.customerSessionCount * 3),
            },
            riskLevel: req.customerTrustScore >= 85 ? 'low' : req.customerTrustScore >= 60 ? 'medium' : 'high',
        };
    }
    async acceptRequest(companionId, requestId) {
        const req = await this.findPendingOrThrow(companionId, requestId);
        const updated = await this.prisma.bookingRequest.update({
            where: { id: requestId },
            data: { status: 'accepted', respondedAt: new Date() },
        });
        const sessionPassCode = this.generatePassCode(req.customerInitials);
        const session = await this.prisma.session.create({
            data: {
                companionId,
                customerId: req.customerId,
                requestId,
                status: 'upcoming',
                category: req.category,
                customerInitials: req.customerInitials,
                customerTrustScore: req.customerTrustScore,
                customerVerified: req.customerVerified,
                customerSessionCount: req.customerSessionCount,
                customerSafetyConsent: req.customerSafetyConsent,
                customerIdentityVerified: req.customerIdentityVerified,
                venueId: req.venueId,
                venueName: req.venueName,
                venueArea: req.venueArea,
                venueCity: req.venueCity,
                venueType: req.venueType,
                venueMeetingPoint: req.venueMeetingPoint,
                venueLandmark: req.venueLandmark,
                isVenueApproved: req.isVenueApproved,
                scheduledStart: req.proposedStart,
                scheduledEnd: req.proposedEnd,
                durationMinutes: req.durationMinutes,
                language: req.language,
                baseEarning: req.estimatedEarning,
                bonusEarning: 0,
                estimatedTotal: req.estimatedEarning,
                sessionPassCode,
            },
        });
        const notif = await this.prisma.notification.create({
            data: {
                companionId,
                type: 'request',
                title: 'Booking Accepted ✓',
                body: `You accepted the booking from ${req.customerInitials} at ${req.venueName}. Session created with pass code: ${sessionPassCode}`,
                data: JSON.stringify({ sessionId: session.id, requestId }),
                isRead: false,
            },
        });
        this.notificationsGateway.emitNotification(companionId, {
            notificationId: notif.id,
            type: 'request',
            title: notif.title,
            body: notif.body,
            data: { sessionId: session.id, requestId },
        });
        this.logger.log(`Request ${requestId} accepted → Session ${session.id} created`);
        return {
            request: this.toRequestResponse(updated),
            session: { sessionId: session.id, sessionPassCode },
            message: 'Booking accepted! Session created successfully.',
        };
    }
    async declineRequest(companionId, requestId, reason) {
        const req = await this.findPendingOrThrow(companionId, requestId);
        const updated = await this.prisma.bookingRequest.update({
            where: { id: requestId },
            data: { status: 'declined', declineReason: reason, respondedAt: new Date() },
        });
        const notif = await this.prisma.notification.create({
            data: {
                companionId,
                type: 'request',
                title: 'Booking Declined',
                body: `You declined the booking from ${req.customerInitials} at ${req.venueName}. Reason: ${reason}`,
                data: JSON.stringify({ requestId }),
                isRead: false,
            },
        });
        this.notificationsGateway.emitNotification(companionId, {
            notificationId: notif.id,
            type: 'request',
            title: notif.title,
            body: notif.body,
        });
        return {
            request: this.toRequestResponse(updated),
            message: 'Booking declined.',
        };
    }
    async counterPropose(companionId, requestId, newStart, newEnd) {
        const req = await this.findPendingOrThrow(companionId, requestId);
        const updated = await this.prisma.bookingRequest.update({
            where: { id: requestId },
            data: {
                status: 'counter_proposed',
                counterProposedStart: new Date(newStart),
                counterProposedEnd: new Date(newEnd),
                respondedAt: new Date(),
            },
        });
        return {
            request: this.toRequestResponse(updated),
            message: 'Counter proposal sent to customer.',
        };
    }
    async findPendingOrThrow(companionId, requestId) {
        const req = await this.prisma.bookingRequest.findFirst({
            where: { id: requestId, companionId, status: { in: ['pending', 'counter_proposed'] } },
        });
        if (!req)
            throw new common_1.NotFoundException('Pending booking request not found');
        if (new Date() > req.expiresAt)
            throw new common_1.BadRequestException('This request has expired');
        return req;
    }
    generatePassCode(initials) {
        const suffix = Math.floor(100 + Math.random() * 900).toString();
        return `${initials.replace('.', '').slice(0, 2)}-${suffix}`;
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = RequestsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_gateway_1.NotificationsGateway])
], RequestsService);
//# sourceMappingURL=requests.service.js.map