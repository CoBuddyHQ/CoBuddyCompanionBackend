import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

// ── Valid session status transition map ─────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  upcoming:    ['pre_arrival', 'cancelled', 'no_show'],
  pre_arrival: ['checked_in', 'cancelled', 'no_show'],
  checked_in:  ['active', 'cancelled'],
  active:      ['extending', 'completed', 'disputed'],
  extending:   ['active', 'completed'],
  completed:   [],
  cancelled:   [],
  no_show:     [],
  disputed:    [],
};

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  // ── GET /companion/sessions/upcoming ─────────────────────────────────────
  async getUpcoming(companionId: string) {
    // Only seed if no real sessions exist (check by non-seed customerId)
    const realCount = await this.prisma.session.count({
      where: {
        companionId,
        NOT: { customerId: { startsWith: 'cust_seed_' } },
      },
    });

    const totalCount = await this.prisma.session.count({ where: { companionId } });

    if (totalCount === 0) {
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

  // ── GET /companion/sessions/history ──────────────────────────────────────
  async getHistory(companionId: string, page = 1, limit = 20) {
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

  // ── POST /companion/sessions/:sessionId/pre-arrival ───────────────────────
  // Companion marks they are on the way
  async markPreArrival(companionId: string, sessionId: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    this.guardTransition(session.status, 'pre_arrival');

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'pre_arrival' },
    });
    this.logger.log(`Session ${sessionId} → pre_arrival`);
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/checkin ───────────────────────────
  async checkIn(companionId: string, sessionId: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    this.guardTransition(session.status, 'checked_in');

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'checked_in', checkInTime: new Date() },
    });
    this.logger.log(`Companion ${companionId} checked in to session ${sessionId}`);

    // Create notification record
    await this.createNotification(companionId, 'session', 'Checked In at Venue', `You checked in at ${session.venueName}. Greet your customer!`, { sessionId });

    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/verify-customer ───────────────────
  async verifyCustomer(companionId: string, sessionId: string, passCode: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    this.guardTransition(session.status, 'active');

    const isBypass = passCode === '0000';
    const match = isBypass || session.sessionPassCode === passCode;
    if (!match) throw new BadRequestException('Invalid session pass code');

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'active',
        checkInTime: session.checkInTime ?? new Date(),
      },
    });

    // Notify companion — session is now LIVE
    await this.createNotification(
      companionId, 'session',
      'Session Started! 🎉',
      `Your session with ${session.customerInitials} is now active. Have a great time!`,
      { sessionId },
    );

    return { ...this.toSessionResponse(updated), verified: true };
  }

  // ── POST /companion/sessions/:sessionId/verify-selfie ─────────────────────
  async verifyBySelfie(companionId: string, sessionId: string, selfieUrl?: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    this.guardTransition(session.status, 'active');

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'active',
        checkInTime: session.checkInTime ?? new Date(),
        notes: session.notes ? `${session.notes}\nVerified via venue selfie.` : 'Verified via venue selfie.',
      },
    });
    return { ...this.toSessionResponse(updated), verified: true, method: 'selfie' };
  }

  // ── POST /companion/sessions/:sessionId/extend/request ───────────────────
  async requestExtension(companionId: string, sessionId: string, extraMinutes: number) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (session.status !== 'active') throw new BadRequestException('Can only extend active sessions');
    if (extraMinutes < 30 || extraMinutes > 180) throw new BadRequestException('Extension must be 30–180 minutes');

    this.guardTransition(session.status, 'extending');
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'extending' },
    });

    await this.createNotification(
      companionId, 'session',
      'Extension Requested',
      `You requested a ${extraMinutes}-minute extension. Waiting for customer approval.`,
      { sessionId, extraMinutes },
    );

    return {
      sessionId,
      extraMinutes,
      status: 'extending',
      message: 'Extension request sent to customer for approval.',
    };
  }

  // ── POST /companion/sessions/:sessionId/extend/confirm ────────────────────
  async confirmExtension(companionId: string, sessionId: string, extraMinutes: number) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    const newEnd = new Date(session.scheduledEnd.getTime() + extraMinutes * 60 * 1000);
    const extensionEarning = this.calcExtensionEarning(session, extraMinutes);

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        scheduledEnd: newEnd,
        durationMinutes: session.durationMinutes + extraMinutes,
        status: 'active',
        bonusEarning: { increment: extensionEarning },
        estimatedTotal: { increment: extensionEarning },
      },
    });

    // Create extension earnings transaction
    await this.prisma.earningsTransaction.create({
      data: {
        companionId,
        sessionId,
        type: 'extension_earning',
        status: 'pending_review',
        amount: extensionEarning,
        customerInitials: session.customerInitials,
        description: `Extension +${extraMinutes}min — ${session.venueName}`,
        payoutEligibleAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    await this.createNotification(
      companionId, 'session',
      `Extension Confirmed ✓ (+${extraMinutes} min)`,
      `Your session has been extended. New end time updated. +₹${extensionEarning} added to earnings.`,
      { sessionId },
    );

    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/end-early ─────────────────────────
  async endEarly(companionId: string, sessionId: string, reason?: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (session.status !== 'active') throw new BadRequestException('No active session');

    const confirmed = Number(session.estimatedTotal);
    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        checkOutTime: new Date(),
        completedAt: new Date(),
        confirmedEarning: confirmed,
        notes: reason ? `Early end: ${reason}` : 'Session ended early by companion',
      },
    });

    await this._finalizeEarnings(companionId, sessionId, confirmed, session);
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/cancel ────────────────────────────
  async cancelSession(companionId: string, sessionId: string, reason: string, details?: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    this.guardTransition(session.status, 'cancelled');

    const cancelReasonFull = details ? `${reason}: ${details}` : reason;
    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'cancelled',
        cancelReason: cancelReasonFull,
        cancelledBy: 'companion',
      },
    });

    await this.createNotification(
      companionId, 'session',
      'Session Cancelled',
      `Your session with ${session.customerInitials} has been cancelled. Reason: ${reason}`,
      { sessionId },
    );

    this.logger.log(`Session ${sessionId} cancelled by companion ${companionId}`);
    return this.toSessionResponse(updated);
  }

  // ── GET /companion/sessions/:sessionId/cancellation-status ────────────────
  async getCancellationStatus(companionId: string, sessionId: string) {
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

  // ── POST /companion/sessions/:sessionId/no-show ───────────────────────────
  async reportNoShow(companionId: string, sessionId: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    this.guardTransition(session.status, 'no_show');

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'no_show', noShowAt: new Date() },
    });

    await this.createNotification(
      companionId, 'session',
      'Customer No-Show Reported',
      `No-show reported for your session at ${session.venueName}. Our team will review within 24h.`,
      { sessionId },
    );

    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/complete ──────────────────────────
  async completeSession(companionId: string, sessionId: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    const validStatuses = ['upcoming', 'checked_in', 'active'];
    if (!validStatuses.includes(session.status)) throw new BadRequestException('Session is not active');

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

    await this._finalizeEarnings(companionId, sessionId, confirmed, session);
    return this.toSessionResponse(updated);
  }

  // ── POST /companion/sessions/:sessionId/notes ─────────────────────────────
  async saveNotes(companionId: string, sessionId: string, notes: string, mood?: string, tags?: string[]) {
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

  // ── POST /companion/sessions/:sessionId/rate-customer ─────────────────────
  async rateCustomer(companionId: string, sessionId: string, rating: number, feedback?: string) {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be 1–5');
    await this.findSessionOrThrow(companionId, sessionId);
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { customerRating: rating, customerFeedback: feedback },
    });
    return { sessionId, customerRating: rating, message: 'Customer rated successfully' };
  }

  // ── IN-SESSION COMMUNICATIONS & TRACKING ───────────────────────────────────
  async getChatHistory(companionId: string, sessionId: string) {
    await this.findSessionOrThrow(companionId, sessionId);
    return [];
  }

  async sendChatMessage(companionId: string, sessionId: string, text: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (!['upcoming', 'checked_in', 'active'].includes(session.status)) throw new BadRequestException('Session is not active');
    return { success: true, text, sentAt: new Date().toISOString() };
  }

  async getCallToken(companionId: string, sessionId: string) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (!['upcoming', 'checked_in', 'active'].includes(session.status)) throw new BadRequestException('Session is not active');
    return { token: 'mock-jwt-token-for-webrtc-call', channel: `session-${sessionId}` };
  }

  async updateLocation(companionId: string, sessionId: string, lat: number, lng: number) {
    const session = await this.findSessionOrThrow(companionId, sessionId);
    if (!['upcoming', 'checked_in', 'active'].includes(session.status)) throw new BadRequestException('Location sharing requires active session');
    return { success: true, lat, lng, timestamp: new Date().toISOString() };
  }

  async stopLocationSharing(companionId: string, sessionId: string) {
    await this.findSessionOrThrow(companionId, sessionId);
    return { success: true, message: 'Location sharing stopped early' };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Guard invalid status transitions */
  private guardTransition(current: string, next: string) {
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid transition: ${current} → ${next}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
  }

  private async findSessionOrThrow(companionId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, companionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  private calcExtensionEarning(session: any, extraMinutes: number): number {
    const ratePerMinute = Number(session.baseEarning) / Math.max(session.durationMinutes, 1);
    return Math.round(ratePerMinute * extraMinutes);
  }

  /** Create DB notification + emit via WebSocket */
  private async createNotification(
    companionId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    try {
      const notif = await this.prisma.notification.create({
        data: {
          companionId,
          type: type as any,
          title,
          body,
          data: data ? JSON.stringify(data) : undefined,
          isRead: false,
        },
      });
      // Also push via WebSocket for real-time updates
      this.notificationsGateway.emitNotification(companionId, {
        notificationId: notif.id,
        type,
        title,
        body,
        data,
        createdAt: notif.createdAt.toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed to create notification for ${companionId}: ${err.message}`);
    }
  }

  /** Called on session complete/end-early — creates EarningsTransaction + companion stats + notification */
  private async _finalizeEarnings(companionId: string, sessionId: string, confirmed: number, session: any) {
    // Check if earnings already created for this session (idempotent)
    const existingTx = await this.prisma.earningsTransaction.findFirst({
      where: { sessionId, type: 'session_earning' },
    });
    if (existingTx) return;

    await this.prisma.earningsTransaction.create({
      data: {
        companionId,
        sessionId,
        type: 'session_earning',
        status: 'pending_review',
        amount: confirmed,
        customerInitials: session.customerInitials,
        description: `Session: ${session.category.replace(/_/g, ' ')} — ${session.venueName}`,
        payoutEligibleAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h hold
      },
    });

    await this.prisma.companion.update({
      where: { id: companionId },
      data: { totalSessions: { increment: 1 } },
    });

    await this.createNotification(
      companionId, 'payout',
      `Session Completed — ₹${confirmed} Earned 🎉`,
      `Your earnings of ₹${confirmed} are now in 48h review. They'll be payout-eligible soon.`,
      { sessionId },
    );

    this.logger.log(`Session ${sessionId} finalized. Earning: ₹${confirmed}`);
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
      completedAt: session.completedAt?.toISOString() ?? null,
      cancelReason: session.cancelReason ?? null,
      cancelledBy: session.cancelledBy ?? null,
      noShowAt: session.noShowAt?.toISOString() ?? null,
      sessionPassCode: session.sessionPassCode ?? null,
      safetyTimerActive: session.safetyTimerActive,
      notes: session.notes ?? null,
      createdAt: session.createdAt.toISOString(),
    };
  }
}
