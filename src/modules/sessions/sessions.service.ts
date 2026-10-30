import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { InternalBridgeService } from '../internal/internal-bridge.service';
import { Cron } from '@nestjs/schedule';

// ── Valid session status transition map ─────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  upcoming:    ['pre_arrival', 'cancelled', 'no_show', 'checked_in', 'active', 'completed'],
  pre_arrival: ['checked_in', 'cancelled', 'no_show', 'active', 'completed'],
  checked_in:  ['active', 'cancelled', 'extending', 'completed'],
  active:      ['extending', 'completed', 'disputed'],
  extending:   ['active', 'completed', 'disputed'],
  completed:   [],
  cancelled:   [],
  no_show:     [],
  disputed:    [],
};

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  private reconciliationRunning = false;

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    @Optional() private internalBridgeService?: InternalBridgeService,
  ) {}

  @Cron('*/15 * * * * *')
  async reconcileRecentBookingStatuses(): Promise<void> {
    if (this.reconciliationRunning || !this.internalBridgeService) return;
    this.reconciliationRunning = true;
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          requestId: { not: null },
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: { in: ['upcoming', 'active', 'extending', 'completed', 'cancelled'] },
        },
        select: { id: true, requestId: true, status: true, sessionPassCode: true },
        take: 200,
        orderBy: { updatedAt: 'asc' },
      });
      for (const session of sessions) {
        let status: 'accepted' | 'in_progress' | 'completed' | 'cancelled';
        switch (session.status) {
          case 'upcoming': status = 'accepted'; break;
          case 'active':
          case 'extending': status = 'in_progress'; break;
          case 'completed':
          case 'cancelled': status = session.status; break;
          default: continue;
        }
        const synced = await this.internalBridgeService.syncBookingStatus({
          customerBookingId: session.requestId!,
          sessionId: session.id,
          status,
          ...(status === 'accepted' && session.sessionPassCode
            ? { sessionPassCode: session.sessionPassCode }
            : {}),
        });
        if (!synced) break;
      }
    } catch {
      this.logger.warn('Recent booking status reconciliation failed; it will retry on the next interval.');
    } finally {
      this.reconciliationRunning = false;
    }
  }

  // ── GET /companion/sessions/upcoming ─────────────────────────────────────
  async getUpcoming(companionId: string) {
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

    if (!session.sessionPassCode || typeof passCode !== 'string' || session.sessionPassCode !== passCode) {
      throw new BadRequestException('Invalid session pass code');
    }

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

    // S2S cross-backend sync to Customer Backend
    if (session.requestId) {
      await this.notifyCustomerBackendOfSessionUpdate(session.requestId, {
        status: 'in_progress',
        sessionId: session.id,
      }).catch(() => this.logger.warn('Failed to sync session start to Customer Backend.'));
    }

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
    if (!['active', 'checked_in', 'extending'].includes(session.status)) {
      throw new BadRequestException('Can only extend active sessions');
    }
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

    // S2S cross-backend sync to Customer Backend
    if (session.requestId) {
      await this.notifyCustomerBackendOfSessionUpdate(session.requestId, {
        status: 'completed',
        sessionId: session.id,
      }).catch(() => this.logger.warn('Failed to sync session completion to Customer Backend.'));
    }

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

    // S2S cross-backend sync to Customer Backend
    if (session.requestId) {
      await this.notifyCustomerBackendOfSessionUpdate(session.requestId, {
        status: 'cancelled',
        reason: cancelReasonFull,
        sessionId: session.id,
      }).catch(() => this.logger.warn('Failed to sync session cancellation to Customer Backend.'));
    }

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
    const validStatuses = ['upcoming', 'checked_in', 'active', 'extending'];
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

    // S2S cross-backend sync to Customer Backend
    if (session.requestId) {
      await this.notifyCustomerBackendOfSessionUpdate(session.requestId, {
        status: 'completed',
        sessionId: session.id,
      }).catch(() => this.logger.warn('Failed to sync session completion to Customer Backend.'));
    }

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
  async rateCustomer(
    companionId: string,
    sessionId: string,
    rating: number,
    feedback?: string,
    highlights?: string[],
  ) {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be 1–5');
    const session = await this.findSessionOrThrow(companionId, sessionId);
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { customerRating: rating, customerFeedback: feedback },
    });

    const bookingId = session.requestId || sessionId;

    // Notify Customer Backend (S2S)
    await this.notifyCustomerBackendOfSessionUpdate(bookingId, {
      status: 'customer_rated',
      customerRating: rating,
      customerFeedback: feedback,
      highlights,
    }).catch(() => {});

    // Notify Admin Backend (S2S)
    this.notifyAdminBackendOfReview({
      bookingId,
      byCompanionId: companionId,
      toCustomerId: session.customerId,
      rating,
      text: feedback,
      tagCodes: highlights,
    }).catch(() => {});

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
    const callToken = Buffer.from(JSON.stringify({ sessionId, companionId, ts: Date.now() })).toString('base64url');
    return { token: callToken, channel: `session-${sessionId}` };
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
      const route = data?.route || (data?.sessionId ? 'CPN_097_SessionDetail' : undefined);
      const params = data?.params || (data?.sessionId ? { sessionId: data.sessionId } : undefined);
      const enrichedData = data ? { ...data, ...(route ? { route, params } : {}) } : undefined;

      const notif = await this.prisma.notification.create({
        data: {
          companionId,
          type: type as any,
          title,
          body,
          data: enrichedData ? JSON.stringify(enrichedData) : undefined,
          isRead: false,
        },
      });
      // Also push via WebSocket for real-time updates
      this.notificationsGateway.emitNotification(companionId, {
        notificationId: notif.id,
        type,
        category: type,
        title,
        body,
        actionRoute: route ?? null,
        actionParams: params ?? null,
        data: enrichedData,
        createdAt: notif.createdAt.toISOString(),
      });

      if (data?.sessionId) {
        const current = await this.prisma.session.findFirst({
          where: { id: data.sessionId, companionId }, select: { status: true },
        });
        if (current) this.notificationsGateway.emitSessionUpdated(companionId, {
          sessionId: data.sessionId, status: current.status,
        });
      }
    } catch {
      this.logger.warn('Failed to create a session notification.');
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

    this.logger.log('Session finalized and earnings recorded.');
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

  // ── S2S HELPER: NOTIFY CUSTOMER BACKEND OF SESSION UPDATES ────────────────
  private async notifyCustomerBackendOfSessionUpdate(bookingId: string, payload: any) {
    if (this.internalBridgeService) {
      await this.internalBridgeService.syncBookingStatus({
        customerBookingId: bookingId,
        ...payload,
      });
      return;
    }

    const customerBackendUrl = process.env.CUSTOMER_API_URL || 'http://localhost:4002';
    const internalToken = process.env.INTERNAL_SERVICE_SECRET;
    if (!internalToken) {
      this.logger.warn(`Cannot notify customer backend for booking ${bookingId}: S2S secret is not configured`);
      return;
    }
    try {
      const res = await fetch(`${customerBackendUrl}/api/v1/internal/bookings/${bookingId}/status-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-service-key': internalToken,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`Failed to notify customer backend for booking ${bookingId}: ${res.status}`);
      } else {
        this.logger.log(`Synced session status ${payload.status} for booking ${bookingId} to customer backend`);
      }
    } catch {
      this.logger.warn('Error connecting to Customer Backend for session status sync.');
    }
  }

  // ── S2S HELPER: NOTIFY ADMIN BACKEND OF BOOKING UPDATES ───────────────────
  private async notifyAdminBackendOfBookingSync(payload: any) {
    const adminBackendUrl = process.env.ADMIN_API_URL || 'http://admin-backend:4000';
    const internalToken = process.env.INTERNAL_SERVICE_SECRET;
    if (!internalToken) return;
    try {
      await fetch(`${adminBackendUrl}/api/internal/bookings/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-service-key': internalToken,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      this.logger.log(`Synced session ${payload.bookingId} to Admin Backend as ${payload.status}`);
    } catch {
      this.logger.warn('Error connecting to Admin Backend for booking sync.');
    }
  }

  // ── S2S HELPER: NOTIFY ADMIN BACKEND OF REVIEWS ───────────────────────────
  private async notifyAdminBackendOfReview(payload: any) {
    const adminBackendUrl = process.env.ADMIN_API_URL || 'http://admin-backend:4000';
    const internalToken = process.env.INTERNAL_SERVICE_SECRET;
    if (!internalToken) return;
    try {
      await fetch(`${adminBackendUrl}/api/internal/reviews/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-service-key': internalToken,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      this.logger.log(`Synced review for booking ${payload.bookingId} to Admin Backend`);
    } catch {
      this.logger.warn('Error connecting to Admin Backend for review sync.');
    }
  }
}
