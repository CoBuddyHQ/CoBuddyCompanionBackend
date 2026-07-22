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
    async getAvailability(companionId) {
        const companion = await this.prisma.companion.findUnique({
            where: { id: companionId },
            select: { isAvailable: true }
        });
        const defaultHours = await this.prisma.weeklySchedule.findMany({
            where: { companionId },
            orderBy: { createdAt: 'asc' }
        });
        const dateOverrides = await this.prisma.dateOverride.findMany({
            where: { companionId },
            orderBy: { createdAt: 'desc' }
        });
        const slots = await this.prisma.customSlot.findMany({
            where: { companionId },
            orderBy: { createdAt: 'desc' }
        });
        const vacationMode = await this.prisma.vacationMode.findUnique({
            where: { companionId }
        });
        return {
            isAvailable: companion?.isAvailable ?? false,
            vacationMode: vacationMode ? {
                enabled: vacationMode.enabled,
                awayFrom: vacationMode.awayFrom ?? '',
                returnOn: vacationMode.returnOn ?? ''
            } : { enabled: false, awayFrom: '', returnOn: '' },
            defaultHours: defaultHours.map(d => ({
                day: d.day,
                active: d.active,
                times: d.times
            })),
            dateOverrides: dateOverrides.map(o => ({
                id: o.id,
                startDate: o.startDate,
                endDate: o.endDate,
                reason: o.reason,
                note: o.note ?? undefined,
                fullDay: o.fullDay,
                startTime: o.startTime ?? undefined,
                endTime: o.endTime ?? undefined
            })),
            slots: slots.map(s => ({
                id: s.id,
                date: s.date,
                startTime: s.startTime,
                endTime: s.endTime,
                repeat: s.repeat
            }))
        };
    }
    async setLiveAvailable(companionId, isAvailable) {
        await this.prisma.companion.update({
            where: { id: companionId },
            data: { isAvailable }
        });
        return { success: true, isAvailable };
    }
    async setVacationMode(companionId, dto) {
        const mode = await this.prisma.vacationMode.upsert({
            where: { companionId },
            update: { enabled: dto.enabled, awayFrom: dto.awayFrom, returnOn: dto.returnOn },
            create: { companionId, enabled: dto.enabled, awayFrom: dto.awayFrom, returnOn: dto.returnOn }
        });
        if (dto.enabled) {
            await this.prisma.companion.update({ where: { id: companionId }, data: { isAvailable: false, isOnline: false } });
        }
        return mode;
    }
    async toggleDay(companionId, day) {
        const schedule = await this.prisma.weeklySchedule.findUnique({ where: { companionId_day: { companionId, day } } });
        if (!schedule)
            throw new common_1.NotFoundException('Day not found');
        return this.prisma.weeklySchedule.update({
            where: { id: schedule.id },
            data: { active: !schedule.active }
        });
    }
    async setDayTimes(companionId, day, times) {
        const schedule = await this.prisma.weeklySchedule.findUnique({ where: { companionId_day: { companionId, day } } });
        if (!schedule) {
            return this.prisma.weeklySchedule.create({
                data: { companionId, day, times, active: true }
            });
        }
        return this.prisma.weeklySchedule.update({
            where: { id: schedule.id },
            data: { times }
        });
    }
    async addOverride(companionId, dto) {
        return this.prisma.dateOverride.create({
            data: { companionId, ...dto }
        });
    }
    async removeOverride(companionId, id) {
        return this.prisma.dateOverride.delete({ where: { id } });
    }
    async addSlot(companionId, dto) {
        return this.prisma.customSlot.create({
            data: { companionId, ...dto }
        });
    }
    async updateSlot(companionId, id, dto) {
        return this.prisma.customSlot.update({
            where: { id },
            data: dto
        });
    }
    async removeSlot(companionId, id) {
        return this.prisma.customSlot.delete({ where: { id } });
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AvailabilityService);
//# sourceMappingURL=availability.service.js.map