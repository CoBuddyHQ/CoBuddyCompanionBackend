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
            update: { status: 'ACTIVE', durationMinutes, startedAt: new Date(), expiresAt, sessionId: sessionId ?? null, cancelledAt: null },
            create: { companionId, sessionId: sessionId ?? null, status: 'ACTIVE', durationMinutes, startedAt: new Date(), expiresAt },
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
        if (!timer || timer.status !== 'ACTIVE')
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
            where: { companionId, status: 'ACTIVE' },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        return { status: 'cancelled', message: 'Safety timer cancelled.' };
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
    async reportCustomer(companionId, customerId, reason, sessionId) {
        await this.prisma.incidentReport.create({
            data: {
                companionId,
                sessionId: sessionId ?? null,
                description: reason,
            },
        });
        return { message: 'Customer reported to CoBuddy Safety Team. We will review within 24 hours.' };
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
        return { message: 'Evidence uploaded successfully.' };
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