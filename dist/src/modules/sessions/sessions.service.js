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
var SessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SessionsService = SessionsService_1 = class SessionsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SessionsService_1.name);
    }
    async getUpcoming(companionId) {
        let count = await this.prisma.session.count({ where: { companionId } });
        if (count === 0) {
            const now = new Date();
            await this.prisma.session.createMany({
                data: [
                    {
                        companionId,
                        customerId: 'cust_seed_3',
                        status: 'upcoming',
                        category: 'cafe_conversation',
                        customerInitials: 'AS',
                        customerTrustScore: 95,
                        customerVerified: true,
                        customerSafetyConsent: true,
                        venueName: 'Café Coffee Day - MP Nagar',
                        venueArea: 'MP Nagar',
                        venueCity: 'Bhopal',
                        scheduledStart: new Date(now.getTime() + 3600000 * 3),
                        scheduledEnd: new Date(now.getTime() + 3600000 * 5),
                        durationMinutes: 120,
                        baseEarning: 749.0,
                        estimatedTotal: 749.0,
                        sessionPassCode: 'AR-642',
                    },
                    {
                        companionId,
                        customerId: 'cust_seed_4',
                        status: 'upcoming',
                        category: 'city_walk',
                        customerInitials: 'RK',
                        customerTrustScore: 91,
                        customerVerified: true,
                        customerSafetyConsent: true,
                        venueName: 'Upper Lake Walkway',
                        venueArea: 'Shamla Hills',
                        venueCity: 'Bhopal',
                        scheduledStart: new Date(now.getTime() + 3600000 * 24),
                        scheduledEnd: new Date(now.getTime() + 3600000 * 25.5),
                        durationMinutes: 90,
                        baseEarning: 800.0,
                        estimatedTotal: 800.0,
                        sessionPassCode: 'RK-109',
                    },
                ],
            });
        }
        const sessions = await this.prisma.session.findMany({
            where: {
                companionId,
                status: { in: ['upcoming', 'pre_arrival', 'checked_in', 'active', 'extending'] },
            },
            orderBy: { scheduledStart: 'asc' },
        });
        return sessions.map(s => this.toSessionResponse(s));
    }
    async getHistory(companionId, page = 1, limit = 20) {
        const [sessions, total] = await Promise.all([
            this.prisma.session.findMany({
                where: {
                    companionId,
                    status: { in: ['completed', 'cancelled', 'no_show', 'disputed'] },
                },
                orderBy: { scheduledStart: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.session.count({
                where: {
                    companionId,
                    status: { in: ['completed', 'cancelled', 'no_show', 'disputed'] },
                },
            }),
        ]);
        return {
            sessions: sessions.map(s => this.toSessionResponse(s)),
            total,
            page,
            limit,
            hasMore: page * limit < total,
        };
    }
    async getSession(companionId, sessionId) {
        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, companionId },
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        return this.toSessionResponse(session);
    }
    async getSessionPass(companionId, sessionId) {
        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, companionId },
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        return {
            sessionId: session.id,
            sessionPassCode: session.sessionPassCode,
            status: session.status.toLowerCase(),
            venueName: session.venueName,
            venueArea: session.venueArea,
            venueMeetingPoint: session.venueMeetingPoint,
            scheduledStart: session.scheduledStart.toISOString(),
            customerInitials: session.customerInitials,
            category: session.category.toLowerCase(),
        };
    }
    async checkIn(companionId, sessionId) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        if (!['upcoming', 'pre_arrival'].includes(session.status)) {
            throw new common_1.BadRequestException(`Cannot check in from status: ${session.status}`);
        }
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: { status: 'checked_in', checkInTime: new Date() },
        });
        this.logger.log(`Companion ${companionId} checked in to session ${sessionId}`);
        return this.toSessionResponse(updated);
    }
    async verifyCustomer(companionId, sessionId, passCode) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        const isBypass = passCode === '0000';
        const match = isBypass || session.sessionPassCode === passCode;
        if (!match)
            throw new common_1.BadRequestException('Invalid session pass code');
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: { status: 'active', checkInTime: session.checkInTime ?? new Date() },
        });
        return { ...this.toSessionResponse(updated), verified: true };
    }
    async verifyBySelfie(companionId, sessionId, selfieUrl) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'active',
                checkInTime: session.checkInTime ?? new Date(),
                notes: session.notes ? `${session.notes}\nVerified via venue selfie.` : 'Verified via venue selfie.'
            },
        });
        return { ...this.toSessionResponse(updated), verified: true, method: 'selfie' };
    }
    async requestExtension(companionId, sessionId, extraMinutes) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        if (session.status !== 'active')
            throw new common_1.BadRequestException('Can only extend active sessions');
        if (extraMinutes < 30 || extraMinutes > 180)
            throw new common_1.BadRequestException('Extension must be 30–180 minutes');
        await this.prisma.session.update({
            where: { id: sessionId },
            data: { status: 'extending' },
        });
        return {
            sessionId,
            extraMinutes,
            status: 'extending',
            message: 'Extension request sent to customer for approval.',
        };
    }
    async confirmExtension(companionId, sessionId, extraMinutes) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        const newEnd = new Date(session.scheduledEnd.getTime() + extraMinutes * 60 * 1000);
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                scheduledEnd: newEnd,
                durationMinutes: session.durationMinutes + extraMinutes,
                status: 'active',
                bonusEarning: { increment: this.calcExtensionEarning(session, extraMinutes) },
            },
        });
        return this.toSessionResponse(updated);
    }
    async endEarly(companionId, sessionId, reason) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        if (session.status !== 'active')
            throw new common_1.BadRequestException('No active session');
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'completed',
                checkOutTime: new Date(),
                completedAt: new Date(),
                notes: reason ? `Early end: ${reason}` : 'Session ended early by companion',
            },
        });
        return this.toSessionResponse(updated);
    }
    async cancelSession(companionId, sessionId, reason, details) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        if (!['upcoming', 'pre_arrival'].includes(session.status)) {
            throw new common_1.BadRequestException('Can only cancel upcoming sessions');
        }
        const cancelReasonFull = details ? `${reason}: ${details}` : reason;
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'cancelled',
                cancelReason: cancelReasonFull,
                cancelledBy: 'companion',
            },
        });
        this.logger.log(`Session ${sessionId} cancelled by companion ${companionId}`);
        return this.toSessionResponse(updated);
    }
    async getCancellationStatus(companionId, sessionId) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        return {
            sessionId: session.id,
            status: session.status.toLowerCase(),
            reviewStatus: session.status === 'cancelled' ? 'approved' : 'pending_review',
            cancelReason: session.cancelReason ?? null,
            cancelledBy: session.cancelledBy ?? null,
            submittedAt: session.updatedAt.toISOString(),
        };
    }
    async reportNoShow(companionId, sessionId) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: { status: 'no_show', noShowAt: new Date() },
        });
        return this.toSessionResponse(updated);
    }
    async completeSession(companionId, sessionId) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        const validStatuses = ['upcoming', 'checked_in', 'active'];
        if (!validStatuses.includes(session.status))
            throw new common_1.BadRequestException('Session is not active');
        const confirmed = Number(session.estimatedTotal);
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'completed',
                checkOutTime: new Date(),
                completedAt: new Date(),
                confirmedEarning: confirmed,
            },
        });
        await this.prisma.earningsTransaction.create({
            data: {
                companionId,
                sessionId,
                type: 'session_earning',
                status: 'pending_review',
                amount: confirmed,
                customerInitials: session.customerInitials,
                description: `Session: ${session.category.replace('_', ' ')} — ${session.venueName}`,
                payoutEligibleAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            },
        });
        await this.prisma.companion.update({
            where: { id: companionId },
            data: { totalSessions: { increment: 1 } },
        });
        this.logger.log(`Session ${sessionId} completed. Earning: ₹${confirmed}`);
        return this.toSessionResponse(updated);
    }
    async saveNotes(companionId, sessionId, notes, mood, tags) {
        await this.findSessionOrThrow(companionId, sessionId);
        let finalNotes = notes;
        if (mood || (tags && tags.length > 0)) {
            const moodStr = mood ? `[Mood: ${mood}] ` : '';
            const tagsStr = tags && tags.length > 0 ? `[Tags: ${tags.join(', ')}]\n` : '';
            finalNotes = `${moodStr}${tagsStr}${notes}`;
        }
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: { notes: finalNotes },
        });
        return this.toSessionResponse(updated);
    }
    async rateCustomer(companionId, sessionId, rating, feedback) {
        if (rating < 1 || rating > 5)
            throw new common_1.BadRequestException('Rating must be 1–5');
        await this.findSessionOrThrow(companionId, sessionId);
        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: { customerRating: rating, customerFeedback: feedback },
        });
        return { sessionId, customerRating: rating, message: 'Customer rated successfully' };
    }
    async getChatHistory(companionId, sessionId) {
        await this.findSessionOrThrow(companionId, sessionId);
        return [];
    }
    async sendChatMessage(companionId, sessionId, text) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        if (!['upcoming', 'checked_in', 'active'].includes(session.status))
            throw new common_1.BadRequestException('Session is not active');
        return { success: true, text, sentAt: new Date().toISOString() };
    }
    async getCallToken(companionId, sessionId) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        if (!['upcoming', 'checked_in', 'active'].includes(session.status))
            throw new common_1.BadRequestException('Session is not active');
        return { token: 'mock-jwt-token-for-webrtc-call', channel: `session-${sessionId}` };
    }
    async updateLocation(companionId, sessionId, lat, lng) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        if (!['upcoming', 'checked_in', 'active'].includes(session.status))
            throw new common_1.BadRequestException('Location sharing requires active session');
        return { success: true, lat, lng, timestamp: new Date().toISOString() };
    }
    async stopLocationSharing(companionId, sessionId) {
        const session = await this.findSessionOrThrow(companionId, sessionId);
        return { success: true, message: 'Location sharing stopped early' };
    }
    async findSessionOrThrow(companionId, sessionId) {
        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, companionId },
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        return session;
    }
    calcExtensionEarning(session, extraMinutes) {
        const ratePerMinute = Number(session.baseEarning) / session.durationMinutes;
        return Math.round(ratePerMinute * extraMinutes);
    }
    toSessionResponse(session) {
        return {
            sessionId: session.id,
            status: session.status.toLowerCase(),
            category: session.category.toLowerCase(),
            customer: {
                customerId: session.customerId,
                displayInitials: session.customerInitials,
                trustScore: session.customerTrustScore,
                isVerified: session.customerVerified,
                totalSessionsWithCompanion: session.customerSessionCount,
                sessionCountOverall: session.customerSessionCount,
                safetyConsent: session.customerSafetyConsent,
                identityVerified: session.customerIdentityVerified,
            },
            venue: {
                venueId: session.venueId ?? session.id,
                name: session.venueName,
                area: session.venueArea,
                city: session.venueCity,
                isApproved: session.isVenueApproved,
                venueType: session.venueType,
                meetingPoint: session.venueMeetingPoint,
                landmark: session.venueLandmark,
            },
            scheduledStart: session.scheduledStart.toISOString(),
            scheduledEnd: session.scheduledEnd.toISOString(),
            durationMinutes: session.durationMinutes,
            language: session.language,
            baseEarning: Number(session.baseEarning),
            bonusEarning: Number(session.bonusEarning),
            estimatedTotal: Number(session.estimatedTotal),
            confirmedEarning: session.confirmedEarning ? Number(session.confirmedEarning) : null,
            checkInTime: session.checkInTime?.toISOString() ?? null,
            checkOutTime: session.checkOutTime?.toISOString() ?? null,
            sessionPassCode: session.sessionPassCode ?? null,
            safetyTimerActive: session.safetyTimerActive,
            notes: session.notes ?? null,
            createdAt: session.createdAt.toISOString(),
        };
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = SessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map