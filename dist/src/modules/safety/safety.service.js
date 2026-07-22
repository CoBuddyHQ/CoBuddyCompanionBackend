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
var SafetyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SafetyService = SafetyService_1 = class SafetyService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SafetyService_1.name);
    }
    async triggerSOS(companionId, sessionId, lat, lng) {
        const sos = await this.prisma.sOSEvent.create({
            data: {
                companionId,
                sessionId: sessionId ?? null,
                latitude: lat,
                longitude: lng,
            },
        });
        this.logger.warn(`🚨 SOS triggered by companion ${companionId}`);
        return {
            sosId: sos.id,
            status: 'triggered',
            message: 'SOS alert sent to your trusted contacts and CoBuddy Safety Team.',
            triggeredAt: sos.createdAt.toISOString(),
        };
    }
    async resolveSOS(companionId, sosId) {
        await this.prisma.sOSEvent.updateMany({
            where: { companionId, id: sosId },
            data: { resolvedAt: new Date(), resolvedBy: 'companion' },
        });
        return { message: 'SOS resolved. Stay safe!' };
    }
    async startTimer(companionId, durationMinutes, sessionId) {
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
        await this.prisma.safetyTimer.upsert({
            where: { companionId },
            update: { status: 'active', durationMinutes, startedAt: new Date(), expiresAt, sessionId: sessionId ?? null, cancelledAt: null },
            create: { companionId, sessionId: sessionId ?? null, status: 'active', durationMinutes, startedAt: new Date(), expiresAt },
        });
        if (sessionId) {
            await this.prisma.session.updateMany({ where: { id: sessionId }, data: { safetyTimerActive: true } });
        }
        return {
            status: 'active',
            durationMinutes,
            expiresAt: expiresAt.toISOString(),
            message: `Safety timer set for ${durationMinutes} minutes.`,
        };
    }
    async checkinTimer(companionId) {
        const timer = await this.prisma.safetyTimer.findUnique({ where: { companionId } });
        if (!timer || timer.status !== 'active')
            throw new common_1.NotFoundException('No active safety timer');
        const newExpiry = new Date(Date.now() + timer.durationMinutes * 60 * 1000);
        await this.prisma.safetyTimer.update({
            where: { companionId },
            data: { lastCheckinAt: new Date(), expiresAt: newExpiry },
        });
        return { status: 'active', nextCheckinAt: newExpiry.toISOString(), message: 'Check-in recorded. Timer reset.' };
    }
    async cancelTimer(companionId) {
        await this.prisma.safetyTimer.updateMany({
            where: { companionId, status: 'active' },
            data: { status: 'cancelled', cancelledAt: new Date() },
        });
        return { status: 'cancelled', message: 'Safety timer cancelled.' };
    }
    async getSettings(companionId) {
        const settings = await this.prisma.companionSettings.findUnique({ where: { companionId } });
        return {
            locationTracking: settings?.locationTracking ?? true,
            autoCheckIn: settings?.autoCheckIn ?? true,
            disguisedCall: settings?.disguisedCall ?? false,
        };
    }
    async updateSettings(companionId, dto) {
        const settings = await this.prisma.companionSettings.upsert({
            where: { companionId },
            update: {
                locationTracking: dto.locationTracking,
                autoCheckIn: dto.autoCheckIn,
                disguisedCall: dto.disguisedCall,
            },
            create: {
                companionId,
                locationTracking: dto.locationTracking ?? true,
                autoCheckIn: dto.autoCheckIn ?? true,
                disguisedCall: dto.disguisedCall ?? false,
            },
        });
        return {
            locationTracking: settings.locationTracking,
            autoCheckIn: settings.autoCheckIn,
            disguisedCall: settings.disguisedCall,
            message: 'Safety settings updated',
        };
    }
    async getTrustedContacts(companionId) {
        const contacts = await this.prisma.trustedContact.findMany({
            where: { companionId, deletedAt: null },
            orderBy: { isEmergencyContact: 'desc' },
        });
        return contacts.map(c => this.toContactResponse(c));
    }
    async addTrustedContact(companionId, dto) {
        const masked = this.maskPhone(dto.phone);
        const contact = await this.prisma.trustedContact.create({
            data: {
                companionId,
                name: dto.name,
                phone: dto.phone,
                maskedPhone: masked,
                relationship: dto.relationship,
                isEmergencyContact: dto.isEmergencyContact ?? false,
            },
        });
        return this.toContactResponse(contact);
    }
    async updateTrustedContact(companionId, contactId, dto) {
        const contact = await this.prisma.trustedContact.updateMany({
            where: { id: contactId, companionId },
            data: {
                name: dto.name,
                phone: dto.phone,
                maskedPhone: dto.phone ? this.maskPhone(dto.phone) : undefined,
                relationship: dto.relationship,
                isEmergencyContact: dto.isEmergencyContact,
            },
        });
        return { contactId, message: 'Contact updated' };
    }
    async deleteTrustedContact(companionId, contactId) {
        await this.prisma.trustedContact.updateMany({
            where: { id: contactId, companionId },
            data: { deletedAt: new Date() },
        });
        return { message: 'Contact removed' };
    }
    async blockCustomer(companionId, customerId, reason) {
        await this.prisma.blockedCustomer.upsert({
            where: { companionId_customerId: { companionId, customerId } },
            update: { reason },
            create: { companionId, customerId, reason },
        });
        return { message: 'Customer blocked. They will not appear in your requests.' };
    }
    async reportCustomer(companionId, customerId, category, description, alsoBlock, sessionId) {
        if (alsoBlock) {
            await this.blockCustomer(companionId, customerId, `Reported (${category}): ${description}`);
        }
        const report = await this.prisma.incidentReport.create({
            data: {
                companionId,
                sessionId: sessionId ?? null,
                description: `[Category: ${category}] ${description}`,
            },
        });
        return { reportId: report.id, message: 'Report submitted. Our safety team will review it within 1 hour.' };
    }
    async reportIncident(companionId, description, sessionId) {
        const report = await this.prisma.incidentReport.create({
            data: { companionId, sessionId: sessionId ?? null, description },
        });
        return { reportId: report.id, message: 'Incident report submitted.', status: 'submitted' };
    }
    async uploadEvidence(companionId, reportId, evidenceUrls) {
        await this.prisma.incidentReport.updateMany({
            where: { id: reportId, companionId },
            data: { evidenceUrls },
        });
        return { message: 'Evidence added to incident report.' };
    }
    async completeSafetyQuiz(companionId, score) {
        if (score >= 4) {
            await this.prisma.companionBadge.upsert({
                where: { companionId_badgeKey: { companionId, badgeKey: 'badge_safety' } },
                update: {},
                create: {
                    companionId,
                    badgeKey: 'badge_safety',
                    badgeName: 'Safety Certified',
                }
            });
            return { success: true, message: 'Congratulations! You earned the Safety Certified badge.', badgeEarned: true };
        }
        return { success: false, message: 'You need at least 4 correct answers to earn the badge.', badgeEarned: false };
    }
    toContactResponse(c) {
        return {
            contactId: c.id,
            name: c.name,
            maskedPhone: c.maskedPhone,
            relationship: c.relationship,
            isEmergencyContact: c.isEmergencyContact,
        };
    }
    maskPhone(phone) {
        if (!phone || phone.length < 4)
            return phone;
        return `+91 ••••••${phone.slice(-4)}`;
    }
};
exports.SafetyService = SafetyService;
exports.SafetyService = SafetyService = SafetyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SafetyService);
//# sourceMappingURL=safety.service.js.map