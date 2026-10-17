import { Injectable, NotFoundException, BadRequestException, Logger, Optional, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateInternalBookingRequestDto } from './dto/internal-booking-request.dto';
import { InternalBridgeService } from '../internal/internal-bridge.service';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    @Optional() private internalBridgeService?: InternalBridgeService,
  ) {}

  // Returns BookingRequest interface from store.types.ts
  private toRequestResponse(r: any) {
    return {
      requestId: r.id,
      status: r.status.toLowerCase(),
      category: r.category.toLowerCase(),
      customer: {
        customerId: r.customerId,
        displayInitials: r.customerInitials,
        trustScore: r.customerTrustScore,
        isVerified: r.customerVerified,
        totalSessionsWithCompanion: r.customerSessionCount,
        sessionCountOverall: r.customerSessionCount,
        safetyConsent: r.customerSafetyConsent,
        identityVerified: r.customerIdentityVerified,
      },
      venue: {
        venueId: r.venueId ?? r.id,
        name: r.venueName,
        area: r.venueArea,
        city: r.venueCity,
        isApproved: r.isVenueApproved,
        venueType: r.venueType,
        meetingPoint: r.venueMeetingPoint,
        landmark: r.venueLandmark,
      },
      proposedStart: r.proposedStart.toISOString(),
      proposedEnd: r.proposedEnd.toISOString(),
      durationMinutes: r.durationMinutes,
      language: r.language,
      estimatedEarning: Number(r.estimatedEarning),
      matchScore: r.matchScore,
      expiresAt: r.expiresAt.toISOString(),
      customerNote: r.customerNote ?? null,
      receivedAt: r.receivedAt.toISOString(),
    };
  }

  // ── GET /companion/requests ───────────────────────────────────────────────
  async getRequests(
    companionId: string,
    status?: string,
    categories?: string,
    minEarning?: number,
    sortBy?: string,
    page = 1,
    limit = 20
  ) {
    const where: any = { companionId };

    if (status && status !== 'all') {
      where.status = status.toLowerCase() as any;
    } else {
      where.status = { in: ['pending', 'expired', 'counter_proposed'] };
    }

    if (categories) {
      const catsArray = categories.split(',').map(c => c.trim().toLowerCase());
      if (catsArray.length > 0) {
        where.category = { in: catsArray as any[] };
      }
    }

    if (minEarning && minEarning > 0) {
      where.estimatedEarning = { gte: minEarning };
    }

    let orderBy: any = { receivedAt: 'desc' };
    if (sortBy === 'newest') {
      orderBy = { receivedAt: 'desc' };
    } else if (sortBy === 'expiring_soon') {
      orderBy = { expiresAt: 'asc' };
    } else if (sortBy === 'highest_earning') {
      orderBy = { estimatedEarning: 'desc' };
    }

    const [requests, total] = await Promise.all([
      this.prisma.bookingRequest.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bookingRequest.count({ where }),
    ]);

    // Auto-expire overdue requests (only for pending)
    const now = new Date();
    await this.prisma.bookingRequest.updateMany({
      where: { companionId, status: 'pending', expiresAt: { lt: now } },
      data: { status: 'expired' },
    });

    const unreadCount = await this.prisma.bookingRequest.count({
      where: { companionId, status: 'pending' },
    });

    return {
      requests: requests.map(r => this.toRequestResponse(r)),
      total,
      unreadCount,
      page,
      limit,
    };
  }

  // ── GET /companion/requests/:requestId ────────────────────────────────────
  async getRequest(companionId: string, requestId: string) {
    const req = await this.prisma.bookingRequest.findFirst({
      where: { id: requestId, companionId },
    });
    if (!req) throw new NotFoundException('Booking request not found');
    return this.toRequestResponse(req);
  }

  // ── GET /companion/requests/:requestId/customer-trust ─────────────────────
  async getCustomerTrust(companionId: string, requestId: string) {
    const req = await this.prisma.bookingRequest.findFirst({
      where: { id: requestId, companionId },
    });
    if (!req) throw new NotFoundException('Request not found');
    return {
      customerId: req.customerId,
      displayInitials: req.customerInitials,
      trustScore: req.customerTrustScore,
      isVerified: req.customerVerified,
      identityVerified: req.customerIdentityVerified,
      safetyConsent: req.customerSafetyConsent,
      sessionCountOverall: req.customerSessionCount,
      // Detailed trust breakdown
      trustBreakdown: {
        identityScore: req.customerIdentityVerified ? 40 : 0,
        safetyScore: req.customerSafetyConsent ? 30 : 0,
        historyScore: Math.min(30, req.customerSessionCount * 3),
      },
      riskLevel: req.customerTrustScore >= 85 ? 'low' : req.customerTrustScore >= 60 ? 'medium' : 'high',
    };
  }

  // ── S2S INTERNAL: CREATE BOOKING REQUEST FROM CUSTOMER BACKEND ──────────
  async createInternalRequest(dto: CreateInternalBookingRequestDto) {
    const proposedStart = new Date(dto.proposedStart);
    const proposedEnd = new Date(dto.proposedEnd);
    const expiresAt = new Date(dto.expiresAt);
    if (!Number.isFinite(proposedStart.getTime()) || !Number.isFinite(proposedEnd.getTime()) || proposedEnd <= proposedStart) {
      throw new BadRequestException('A valid booking time range is required.');
    }
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new BadRequestException('Booking request expiry must be in the future.');
    }
    if (dto.customerSafetyConsent !== true || !Number.isFinite(dto.estimatedEarning) || dto.estimatedEarning <= 0) {
      throw new BadRequestException('Safety consent and positive server pricing are required.');
    }
    const existing = await this.prisma.bookingRequest.findUnique({
      where: { id: dto.bookingId },
    });
    if (existing) {
      if (existing.companionId !== dto.companionId || existing.customerId !== dto.customerId) {
        throw new ConflictException('Booking identifier is already associated with a different customer or companion.');
      }
      return { success: true, requestId: existing.id, request: this.toRequestResponse(existing) };
    }

    const companion = await this.prisma.companion.findFirst({
      where: { id: dto.companionId, accountStatus: 'active', verificationStatus: 'approved', profileStatus: 'published' },
      select: { id: true, hourlyRate: true },
    });
    if (!companion) {
      throw new NotFoundException(`Companion with ID ${dto.companionId} is not eligible for a booking`);
    }
    const hourlyRate = companion.hourlyRate === null ? 0 : Number(companion.hourlyRate);
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
      throw new BadRequestException('Companion has no published positive rate.');
    }

    const overlap = await this.prisma.session.findFirst({
      where: {
        companionId: dto.companionId,
        status: { in: ['upcoming', 'pre_arrival', 'checked_in', 'active', 'extending'] },
        scheduledStart: { lt: proposedEnd },
        scheduledEnd: { gt: proposedStart },
      },
    });
    if (overlap) throw new ConflictException('Companion already has an overlapping active session.');
    const overlappingRequest = await this.prisma.bookingRequest.findFirst({
      where: {
        companionId: dto.companionId,
        status: 'pending',
        proposedStart: { lt: proposedEnd },
        proposedEnd: { gt: proposedStart },
        expiresAt: { gt: new Date() },
      },
    });
    if (overlappingRequest) throw new ConflictException('Companion already has an overlapping pending request.');

    const category = this.mapToCategoryEnum(dto.category);

    const created = await this.prisma.$transaction(async (tx) => {
      const req = await tx.bookingRequest.create({
        data: {
          id: dto.bookingId,
          companionId: dto.companionId,
          customerId: dto.customerId,
          category,
          customerInitials: dto.customerInitials || 'C.U.',
          ...(dto.customerTrustScore !== undefined ? { customerTrustScore: dto.customerTrustScore } : {}),
          customerVerified: dto.customerVerified === true,
          customerSafetyConsent: dto.customerSafetyConsent,
          venueName: dto.venueName,
          venueArea: dto.venueArea || '',
          venueCity: dto.venueCity || '',
          venueType: dto.venueType || 'UNVERIFIED',
          venueMeetingPoint: dto.venueMeetingPoint || null,
          venueLandmark: dto.venueLandmark || null,
          isVenueApproved: false,
          proposedStart,
          proposedEnd,
          durationMinutes: dto.durationMinutes,
          language: dto.language || 'Unspecified',
          estimatedEarning: dto.estimatedEarning,
          customerNote: dto.customerNote || null,
          expiresAt,
          status: 'pending',
        },
      });

      await tx.notification.create({
        data: {
          companionId: dto.companionId,
          type: 'request',
          title: 'New Booking Request',
          body: `You received a booking request from ${dto.customerInitials || 'Customer'} at ${dto.venueName}`,
          data: JSON.stringify({ requestId: req.id }),
          isRead: false,
        },
      });

      return req;
    });

    this.notificationsGateway.emitNotification(dto.companionId, {
      notificationId: `notif-${created.id}`,
      type: 'request',
      title: 'New Booking Request',
      body: `You received a booking request from ${dto.customerInitials || 'Customer'} at ${dto.venueName}`,
      data: { requestId: created.id },
    });

    this.logger.log(`[S2S] Internal booking request created: ${created.id} for companion ${dto.companionId}`);
    return {
      success: true,
      requestId: created.id,
      request: this.toRequestResponse(created),
    };
  }

  // ── POST /companion/requests/:requestId/accept ────────────────────────────
  async acceptRequest(companionId: string, requestId: string) {
    const req = await this.findPendingOrThrow(companionId, requestId);
    const sessionPassCode = this.generatePassCode(req.customerInitials);

    const { updated, session, notif } = await this.prisma.$transaction(async (tx) => {
      const updatedReq = await tx.bookingRequest.update({
        where: { id: requestId },
        data: { status: 'accepted', respondedAt: new Date() },
      });

      const newSession = await tx.session.create({
        data: {
          companionId,
          customerId: req.customerId,
          requestId,
          status: 'upcoming',
          category: req.category,
          customerInitials: req.customerInitials,
          customerTrustScore: req.customerTrustScore,
          customerVerified: req.customerVerified,
          customerSessionCount: req.customerSessionCount,
          customerSafetyConsent: req.customerSafetyConsent,
          customerIdentityVerified: req.customerIdentityVerified,
          venueId: req.venueId,
          venueName: req.venueName,
          venueArea: req.venueArea,
          venueCity: req.venueCity,
          venueType: req.venueType,
          venueMeetingPoint: req.venueMeetingPoint,
          venueLandmark: req.venueLandmark,
          isVenueApproved: req.isVenueApproved,
          scheduledStart: req.proposedStart,
          scheduledEnd: req.proposedEnd,
          durationMinutes: req.durationMinutes,
          language: req.language,
          baseEarning: req.estimatedEarning,
          bonusEarning: 0,
          estimatedTotal: req.estimatedEarning,
          sessionPassCode,
        },
      });

      const dbNotif = await tx.notification.create({
        data: {
          companionId,
          type: 'request',
          title: 'Booking Accepted ✓',
          body: `You accepted the booking from ${req.customerInitials} at ${req.venueName}. Session created with pass code: ${sessionPassCode}`,
          data: JSON.stringify({ sessionId: newSession.id, requestId }),
          isRead: false,
        },
      });

      return { updated: updatedReq, session: newSession, notif: dbNotif };
    });

    this.notificationsGateway.emitNotification(companionId, {
      notificationId: notif.id,
      type: 'request',
      title: notif.title,
      body: notif.body,
      data: { sessionId: session.id, requestId },
    });

    this.logger.log(`Request ${requestId} accepted → Session ${session.id} created`);

    // S2S cross-backend sync to Customer Backend
    await this.notifyCustomerBackendOfStatusUpdate(requestId, {
      status: 'accepted',
      passCode: sessionPassCode,
      companionId,
      sessionId: session.id,
    });

    return {
      request: this.toRequestResponse(updated),
      session: { id: session.id, sessionId: session.id, sessionPassCode },
      sessionId: session.id,
      sessionPassCode,
      message: 'Booking accepted! Session created successfully.',
    };
  }

  // ── POST /companion/requests/:requestId/decline ───────────────────────────
  async declineRequest(companionId: string, requestId: string, reason: string) {
    const req = await this.findPendingOrThrow(companionId, requestId);
    const updated = await this.prisma.bookingRequest.update({
      where: { id: requestId },
      data: { status: 'declined', declineReason: reason, respondedAt: new Date() },
    });

    // Create DB notification for declined request
    const notif = await this.prisma.notification.create({
      data: {
        companionId,
        type: 'request',
        title: 'Booking Declined',
        body: `You declined the booking from ${req.customerInitials} at ${req.venueName}. Reason: ${reason}`,
        data: JSON.stringify({ requestId }),
        isRead: false,
      },
    });
    this.notificationsGateway.emitNotification(companionId, {
      notificationId: notif.id,
      type: 'request',
      title: notif.title,
      body: notif.body,
    });

    // S2S cross-backend sync to Customer Backend
    await this.notifyCustomerBackendOfStatusUpdate(requestId, {
      status: 'declined',
      reason,
      companionId,
    });

    return {
      request: this.toRequestResponse(updated),
      message: 'Booking declined.',
    };
  }

  // ── POST /companion/requests/:requestId/counter ───────────────────────────
  async counterPropose(companionId: string, requestId: string, newStart: string, newEnd: string) {
    const req = await this.findPendingOrThrow(companionId, requestId);
    const updated = await this.prisma.bookingRequest.update({
      where: { id: requestId },
      data: {
        status: 'counter_proposed',
        counterProposedStart: new Date(newStart),
        counterProposedEnd: new Date(newEnd),
        respondedAt: new Date(),
      },
    });

    // S2S cross-backend sync to Customer Backend
    await this.notifyCustomerBackendOfStatusUpdate(requestId, {
      status: 'counter_proposed',
      newStart,
      newEnd,
      companionId,
    });

    return {
      request: this.toRequestResponse(updated),
      message: 'Counter proposal sent to customer.',
    };
  }

  // ── S2S HELPER: NOTIFY CUSTOMER BACKEND ───────────────────────────────────
  private async notifyCustomerBackendOfStatusUpdate(bookingId: string, payload: any) {
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
        this.logger.warn(`Failed to notify customer backend for booking ${bookingId}: ${res.status} ${res.statusText}`);
      } else {
        this.logger.log(`Successfully synced status update for booking ${bookingId} to customer backend`);
      }
    } catch (err: any) {
      this.logger.warn(`Error connecting to customer backend at ${customerBackendUrl}: ${err.message}`);
    }
  }

  private mapToCategoryEnum(cat?: string): any {
    const validCategories = [
      'cafe_conversation',
      'city_walk',
      'art_culture',
      'food_experience',
      'shopping_assistance',
      'events',
      'business_networking',
      'bookstore',
      'wellness_walk',
      'movies',
    ];
    if (!cat) return 'cafe_conversation';
    const normalized = cat.toLowerCase().replace(/[-\s]+/g, '_');
    if (validCategories.includes(normalized)) {
      return normalized;
    }
    if (normalized.includes('walk') || normalized.includes('city')) return 'city_walk';
    if (normalized.includes('food') || normalized.includes('dining')) return 'food_experience';
    if (normalized.includes('art') || normalized.includes('museum')) return 'art_culture';
    if (normalized.includes('shop')) return 'shopping_assistance';
    if (normalized.includes('event')) return 'events';
    if (normalized.includes('business') || normalized.includes('network')) return 'business_networking';
    if (normalized.includes('book')) return 'bookstore';
    if (normalized.includes('wellness') || normalized.includes('fitness')) return 'wellness_walk';
    if (normalized.includes('movie') || normalized.includes('cinema')) return 'movies';
    return 'cafe_conversation';
  }

  private async findPendingOrThrow(companionId: string, requestId: string) {
    // Accept pending OR counter_proposed (companion can still accept their own counter)
    const req = await this.prisma.bookingRequest.findFirst({
      where: { id: requestId, companionId, status: { in: ['pending', 'counter_proposed'] } },
    });
    if (!req) throw new NotFoundException('Pending booking request not found');
    if (new Date() > req.expiresAt) throw new BadRequestException('This request has expired');
    return req;
  }

  private generatePassCode(initials: string): string {
    const suffix = Math.floor(100 + Math.random() * 900).toString();
    return `${initials.replace('.', '').slice(0, 2)}-${suffix}`;
  }
}
