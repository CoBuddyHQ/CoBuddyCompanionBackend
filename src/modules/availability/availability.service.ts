import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  /** GET /companion/availability/slots — Endpoints.AVAILABILITY.GET_SLOTS */
  async getSlots(companionId: string) {
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

  /** POST /companion/availability/slots/add — Endpoints.AVAILABILITY.ADD_SLOT */
  async addSlot(companionId: string, dto: { dayOfWeek: number; startTime: string; endTime: string }) {
    const slot = await this.prisma.timeSlot.create({
      data: { companionId, dayOfWeek: dto.dayOfWeek, startTime: dto.startTime, endTime: dto.endTime },
    });
    return { slotId: slot.id, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime };
  }

  /** PUT /companion/availability/slots/:slotId — Endpoints.AVAILABILITY.UPDATE_SLOT */
  async updateSlot(companionId: string, slotId: string, dto: { startTime?: string; endTime?: string }) {
    const slot = await this.prisma.timeSlot.findFirst({ where: { id: slotId, companionId } });
    if (!slot) throw new NotFoundException('Slot not found');
    const updated = await this.prisma.timeSlot.update({
      where: { id: slotId },
      data: { startTime: dto.startTime ?? slot.startTime, endTime: dto.endTime ?? slot.endTime },
    });
    return { slotId: updated.id, startTime: updated.startTime, endTime: updated.endTime };
  }

  /** DELETE /companion/availability/slots/:slotId — Endpoints.AVAILABILITY.DELETE_SLOT */
  async deleteSlot(companionId: string, slotId: string) {
    const slot = await this.prisma.timeSlot.findFirst({ where: { id: slotId, companionId } });
    if (!slot) throw new NotFoundException('Slot not found');
    await this.prisma.timeSlot.delete({ where: { id: slotId } });
    return { message: 'Slot deleted successfully' };
  }

  /** POST /companion/availability/recurring/add — Endpoints.AVAILABILITY.ADD_RECURRING */
  async addRecurring(companionId: string, dto: { pattern: string; slots: { dayOfWeek: number; startTime: string; endTime: string }[] }) {
    const created = await this.prisma.timeSlot.createMany({
      data: dto.slots.map(s => ({ companionId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
      skipDuplicates: true,
    });
    return { created: created.count, message: `${created.count} recurring slots added` };
  }

  /** POST /companion/availability/block — Endpoints.AVAILABILITY.BLOCK_TIME */
  async blockTime(companionId: string, dto: { date: string; reason?: string }) {
    const blocked = await this.prisma.blockedTime.create({
      data: { companionId, date: new Date(dto.date), reason: dto.reason ?? null },
    });
    return { blockId: blocked.id, date: dto.date, reason: blocked.reason, message: 'Time blocked' };
  }

  /** POST /companion/availability/vacation — Endpoints.AVAILABILITY.VACATION_MODE */
  async setVacationMode(companionId: string, dto: { enabled: boolean; startDate?: string; endDate?: string }) {
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
    // If vacation mode on, set companion offline
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
}
