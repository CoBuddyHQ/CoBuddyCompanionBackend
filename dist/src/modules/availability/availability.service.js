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
    async getSchedule(companionId) {
        const slots = await this.prisma.timeSlot.findMany({
            where: { companionId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
        return { slots };
    }
    async updateSchedule(companionId, dto) {
        await this.prisma.timeSlot.deleteMany({ where: { companionId } });
        if (dto.slots && dto.slots.length > 0) {
            await this.prisma.timeSlot.createMany({
                data: dto.slots.map((s) => ({
                    companionId,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                })),
            });
        }
        return this.getSchedule(companionId);
    }
    async getHolidays(companionId) {
        const holidays = await this.prisma.holiday.findMany({
            where: { companionId, date: { gte: new Date() } },
            orderBy: { date: 'asc' },
        });
        return { holidays };
    }
    async setHolidays(companionId, dto) {
        await this.prisma.holiday.deleteMany({
            where: { companionId, date: { gte: new Date() } },
        });
        if (dto.dates && dto.dates.length > 0) {
            await this.prisma.holiday.createMany({
                data: dto.dates.map((d) => ({
                    companionId,
                    date: new Date(d),
                })),
            });
        }
        return this.getHolidays(companionId);
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AvailabilityService);
//# sourceMappingURL=availability.service.js.map