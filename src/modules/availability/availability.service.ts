import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getSchedule(companionId: string) {
    const slots = await this.prisma.timeSlot.findMany({
      where: { companionId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return { slots };
  }

  async updateSchedule(companionId: string, dto: any) {
    await this.prisma.timeSlot.deleteMany({ where: { companionId } });
    if (dto.slots && dto.slots.length > 0) {
      await this.prisma.timeSlot.createMany({
        data: dto.slots.map((s: any) => ({
          companionId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }
    return this.getSchedule(companionId);
  }

  async getHolidays(companionId: string) {
    const holidays = await this.prisma.holiday.findMany({
      where: { companionId, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    });
    return { holidays };
  }

  async setHolidays(companionId: string, dto: any) {
    await this.prisma.holiday.deleteMany({
      where: { companionId, date: { gte: new Date() } },
    });
    if (dto.dates && dto.dates.length > 0) {
      await this.prisma.holiday.createMany({
        data: dto.dates.map((d: string) => ({
          companionId,
          date: new Date(d),
        })),
      });
    }
    return this.getHolidays(companionId);
  }
}
