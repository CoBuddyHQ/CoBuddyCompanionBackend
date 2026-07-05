import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private prisma: PrismaService) {}

  // ── GET /companion/sessions/upcoming ─────────────────────────────────────
  // Returns Session[] matching store.types.ts Session interface

  async getUpcoming(companionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        companionId,
        status: { in: ['UPCOMING', 'PRE_ARRIVAL', 'CHECKED_IN', 'ACTIVE', 'EXTENDING'] },
      },
      orderBy: { scheduledStart: 'asc' },
    });
    return sessions.map(s => this.toSessionResponse(s));
  }

  // ── GET /companion/sessions/history ──────────────────────────────────────

  async getHistory(companionId: string, page = 1, limit = 20) {
    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where: {
          companionId,
          status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'DISPUTED'] },
        },
        orderBy: { scheduledStart: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.session.count({
        where: {
          companionId,
          status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'DISPUTED'] },
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

  // ── GET /companion/sessions/:sessionId ────────────────────────────────────

  async getSession(companionId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, companionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.toSessionResponse(session);
  }

  // ── GET /companion/sessions/:sessionId/pass ───────────────────────────────

  async getSessionPass(companionId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, companionId },
    });
    if (!session) throw new NotFoundException('Session not found');
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

  // ── POST /companion/sessions/:sessionId/checkin ───────────────────────────

  async checkIn(companionId: string, sessionId: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (!['UPCOMING', 'PRE_ARRIVAL'].includes(session.status)) {
      throw new BadRequestException(`Cannot check in from status: ${session.status}`);
    }
    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CHECKED_IN', checkInTime: new Date() },
    });
    this.logger.log(`Companion ${companionId} checked in to session ${sessionId}`);
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/verify-customer ───────────────────

  async verifyCustomer(companionId: string, sessionId: string, passCode: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    const match = session.sessionPassCode === passCode;
    if (!match) throw new BadRequestException('Invalid session pass code');

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'ACTIVE', checkInTime: session.checkInTime ?? new Date() },
    });
    return { ...this.toSessionResponse(updated), verified: true };
  }

  // ── POST /companion/sessions/:sessionId/extend/request ───────────────────

  async requestExtension(companionId: string, sessionId: string, extraMinutes: number) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (session.status !== 'ACTIVE') throw new BadRequestException('Can only extend active sessions');
    if (extraMinutes < 30 || extraMinutes > 180) throw new BadRequestException('Extension must be 30–180 minutes');

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'EXTENDING' },
    });
    return {
      sessionId,
      extraMinutes,
      status: 'EXTENDING',
      message: 'Extension request sent to customer for approval.',
    };
  }

  // ── POST /companion/sessions/:sessionId/extend/confirm ────────────────────

  async confirmExtension(companionId: string, sessionId: string, extraMinutes: number) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    const newEnd = new Date(session.scheduledEnd.getTime() + extraMinutes * 60 * 1000);

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        scheduledEnd: newEnd,
        durationMinutes: session.durationMinutes + extraMinutes,
        status: 'ACTIVE',
        bonusEarning: { increment: this.calcExtensionEarning(session, extraMinutes) },
      },
    });
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/end-early ─────────────────────────

  async endEarly(companionId: string, sessionId: string, reason?: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (session.status !== 'ACTIVE') throw new BadRequestException('No active session');

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        checkOutTime: new Date(),
        completedAt: new Date(),
        notes: reason ? `Early end: ${reason}` : 'Session ended early by companion',
      },
    });
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/cancel ────────────────────────────

  async cancelSession(companionId: string, sessionId: string, reason: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (!['UPCOMING', 'PRE_ARRIVAL'].includes(session.status)) {
      throw new BadRequestException('Can only cancel upcoming sessions');
    }

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        cancelledBy: 'companion',
      },
    });
    this.logger.log(`Session ${sessionId} cancelled by companion ${companionId}`);
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/no-show ───────────────────────────

  async reportNoShow(companionId: string, sessionId: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'NO_SHOW', noShowAt: new Date() },
    });
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/complete ──────────────────────────

  async completeSession(companionId: string, sessionId: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (session.status !== 'ACTIVE') throw new BadRequestException('Session is not active');

    const confirmed = Number(session.estimatedTotal);
    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        checkOutTime: new Date(),
        completedAt: new Date(),
        confirmedEarning: confirmed,
      },
    });

    // Create earnings transaction
    await this.prisma.earningsTransaction.create({
      data: {
        companionId,
        sessionId,
        type: 'SESSION_EARNING',
        status: 'PENDING_REVIEW',
        amount: confirmed,
        customerInitials: session.customerInitials,
        description: `Session: ${session.category.replace('_', ' ')} — ${session.venueName}`,
        payoutEligibleAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h hold
      },
    });

    await this.prisma.companion.update({
      where: { id: companionId },
      data: { totalSessions: { increment: 1 } },
    });

    this.logger.log(`Session ${sessionId} completed. Earning: ₹${confirmed}`);
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/notes ─────────────────────────────

  async saveNotes(companionId: string, sessionId: string, notes: string) {
    await this.findSessionOrThrow(companionId, sessionId);
    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { notes },
    });
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/rate-customer ─────────────────────

  async rateCustomer(companionId: string, sessionId: string, rating: number, feedback?: string) {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be 1–5');
    await this.findSessionOrThrow(companionId, sessionId);
    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { customerRating: rating, customerFeedback: feedback },
    });
    return { sessionId, customerRating: rating, message: 'Customer rated successfully' };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findSessionOrThrow(companionId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, companionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  private calcExtensionEarning(session: any, extraMinutes: number): number {
    const ratePerMinute = Number(session.baseEarning) / session.durationMinutes;
    return Math.round(ratePerMinute * extraMinutes);
  }

  // Returns EXACT Session interface from store.types.ts
  toSessionResponse(session: any) {
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
}
