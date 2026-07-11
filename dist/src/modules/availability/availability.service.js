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
exports.AvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AvailabilityService = class AvailabilityService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSlots(companionId) {
        const slots = await this.prisma.timeSlot.findMany({
            where: { companionId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
        const blockedTimes = await this.prisma.blockedTime.findMany({
            where: { companionId, date: { gte: new Date() } },
            orderBy: { date: 'asc' },
        });
        const vacationMode = await this.prisma.vacationMode.findUnique({ where: { companionId } });
        return {
            slots: slots.map(s => ({
                slotId: s.id,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
            })),
            blockedTimes: blockedTimes.map(b => ({
                blockId: b.id,
                date: b.date.toISOString().split('T')[0],
                reason: b.reason,
            })),
            vacationMode: vacationMode ? {
                enabled: vacationMode.enabled,
                startDate: vacationMode.startDate?.toISOString().split('T')[0] ?? null,
                endDate: vacationMode.endDate?.toISOString().split('T')[0] ?? null,
            } : { enabled: false, startDate: null, endDate: null },
        };
    }
    async addSlot(companionId, dto) {
        const slot = await this.prisma.timeSlot.create({
            data: { companionId, dayOfWeek: dto.dayOfWeek, startTime: dto.startTime, endTime: dto.endTime },
        });
        return { slotId: slot.id, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime };
    }
    async updateSlot(companionId, slotId, dto) {
        const slot = await this.prisma.timeSlot.findFirst({ where: { id: slotId, companionId } });
        if (!slot)
            throw new common_1.NotFoundException('Slot not found');
        const updated = await this.prisma.timeSlot.update({
            where: { id: slotId },
            data: { startTime: dto.startTime ?? slot.startTime, endTime: dto.endTime ?? slot.endTime },
        });
        return { slotId: updated.id, startTime: updated.startTime, endTime: updated.endTime };
    }
    async deleteSlot(companionId, slotId) {
        const slot = await this.prisma.timeSlot.findFirst({ where: { id: slotId, companionId } });
        if (!slot)
            throw new common_1.NotFoundException('Slot not found');
        await this.prisma.timeSlot.delete({ where: { id: slotId } });
        return { message: 'Slot deleted successfully' };
    }
    async addRecurring(companionId, dto) {
        const created = await this.prisma.timeSlot.createMany({
            data: dto.slots.map(s => ({ companionId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
            skipDuplicates: true,
        });
        return { created: created.count, message: `${created.count} recurring slots added` };
    }
    async blockTime(companionId, dto) {
        const blocked = await this.prisma.blockedTime.create({
            data: { companionId, date: new Date(dto.date), reason: dto.reason ?? null },
        });
        return { blockId: blocked.id, date: dto.date, reason: blocked.reason, message: 'Time blocked' };
    }
    async setVacationMode(companionId, dto) {
        const mode = await this.prisma.vacationMode.upsert({
            where: { companionId },
            update: {
                enabled: dto.enabled,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
            },
            create: {
                companionId,
                enabled: dto.enabled,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
            },
        });
        if (dto.enabled) {
            await this.prisma.companion.update({ where: { id: companionId }, data: { isAvailable: false, isOnline: false } });
        }
        return {
            enabled: mode.enabled,
            startDate: mode.startDate?.toISOString().split('T')[0] ?? null,
            endDate: mode.endDate?.toISOString().split('T')[0] ?? null,
            message: dto.enabled ? 'Vacation mode enabled. You will not receive new requests.' : 'Vacation mode disabled.',
        };
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AvailabilityService);
//# sourceMappingURL=availability.service.js.map