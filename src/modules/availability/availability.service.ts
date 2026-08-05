import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  // ── GET /companion/availability — Endpoints.AVAILABILITY.GET ──────────────────
  async getAvailability(companionId: string) {
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

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const formattedDefaultHours = defaultHours.length > 0
      ? defaultHours.map(d => ({ day: d.day, active: d.active, times: d.times }))
      : daysOfWeek.map(day => ({ day, active: day !== 'Sun', times: '09:00 AM - 06:00 PM' }));

    return {
      isAvailable: companion?.isAvailable ?? false,
      vacationMode: vacationMode ? {
        enabled: vacationMode.enabled,
        awayFrom: vacationMode.awayFrom ?? '',
        returnOn: vacationMode.returnOn ?? ''
      } : { enabled: false, awayFrom: '', returnOn: '' },
      defaultHours: formattedDefaultHours,
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

  // ── PUT /companion/availability/live — Endpoints.AVAILABILITY.SET_LIVE ────────
  async setLiveAvailable(companionId: string, isAvailable: boolean) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { isAvailable }
    });
    return { success: true, isAvailable };
  }

  // ── PUT /companion/availability/vacation — Endpoints.AVAILABILITY.VACATION ──────
  async setVacationMode(companionId: string, dto: { enabled: boolean; awayFrom?: string; returnOn?: string }) {
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

  // ── PUT /companion/availability/weekly/:day — Endpoints.AVAILABILITY.WEEKLY_DAY ─
  async toggleDay(companionId: string, day: string) {
    const schedule = await this.prisma.weeklySchedule.findUnique({ where: { companionId_day: { companionId, day } } });
    if (!schedule) {
      return this.prisma.weeklySchedule.create({
        data: { companionId, day, times: '09:00 AM - 06:00 PM', active: true }
      });
    }
    return this.prisma.weeklySchedule.update({
      where: { id: schedule.id },
      data: { active: !schedule.active }
    });
  }

  async setDayTimes(companionId: string, day: string, times: string) {
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

  // ── POST /companion/availability/overrides — Endpoints.AVAILABILITY.OVERRIDE_ADD 
  async addOverride(companionId: string, dto: any) {
    const startDate = dto.startDate || dto.date || new Date().toISOString();
    const endDate = dto.endDate || dto.date || startDate;
    const reason = dto.reason || 'Personal Leave';
    const note = dto.note || null;
    const fullDay = dto.fullDay ?? (dto.isBlocked ?? true);
    const startTime = dto.startTime || null;
    const endTime = dto.endTime || null;

    await this.prisma.dateOverride.create({
      data: {
        companionId,
        startDate,
        endDate,
        reason,
        note,
        fullDay,
        startTime,
        endTime,
      }
    });

    return this.getAvailability(companionId);
  }

  // ── DELETE /companion/availability/overrides/:id ──────────────────────────────
  async removeOverride(companionId: string, id: string) {
    return this.prisma.dateOverride.delete({ where: { id } });
  }

  // ── POST /companion/availability/slots — Endpoints.AVAILABILITY.SLOT_ADD ────────
  async addSlot(companionId: string, dto: any) {
    return this.prisma.customSlot.create({
      data: { companionId, ...dto }
    });
  }

  // ── PUT /companion/availability/slots/:id ───────────────────────────────────────
  async updateSlot(companionId: string, id: string, dto: any) {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (DAYS.includes(id)) {
      const times = dto.times ?? (dto.startTime && dto.endTime ? `${dto.startTime} - ${dto.endTime}` : '09:00 AM - 06:00 PM');
      await this.setDayTimes(companionId, id, times);
      return this.getAvailability(companionId);
    }

    const existing = await this.prisma.customSlot.findFirst({
      where: { id }
    });

    if (!existing) {
      await this.prisma.customSlot.create({
        data: {
          companionId,
          date: dto.date ?? new Date().toISOString(),
          startTime: dto.startTime ?? '09:00 AM',
          endTime: dto.endTime ?? '06:00 PM',
          repeat: dto.repeat ?? false,
        }
      });
    } else {
      await this.prisma.customSlot.update({
        where: { id },
        data: dto
      });
    }

    return this.getAvailability(companionId);
  }

  // ── DELETE /companion/availability/slots/:id ────────────────────────────────────
  async removeSlot(companionId: string, id: string) {
    try {
      await this.prisma.customSlot.delete({ where: { id } });
    } catch (e) {
      // Ignore if record already deleted
    }
    return this.getAvailability(companionId);
  }
}
