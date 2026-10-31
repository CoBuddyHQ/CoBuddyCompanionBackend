import { Injectable, NotFoundException, BadRequestException, Logger, Optional, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateInternalBookingRequestDto, ModifyInternalBookingRequestDto } from './dto/internal-booking-request.dto';
import { InternalBridgeService } from '../internal/internal-bridge.service';
import { randomInt } from 'crypto';

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
          data: JSON.stringify({
            route: 'CPN_082_NewBookingRequestDetail',
            params: { requestId: req.id },
            requestId: req.id,
          }),
          isRead: false,
        },
      });

      return req;
    });

    const requestResponse = this.toRequestResponse(created);

    // 1. Emit dedicated real-time socket event for companion app
    this.notificationsGateway.emitNewBookingRequest(dto.companionId, requestResponse);

    // 2. Emit live notification payload with explicit actionRoute & deep-link parameters
    this.notificationsGateway.emitNotification(dto.companionId, {
      notificationId: `notif-${created.id}`,
      type: 'request',
      category: 'request',
      priority: 'high',
      title: 'New Booking Request',
      body: `You received a booking request from ${dto.customerInitials || 'Customer'} at ${dto.venueName}`,
      actionRoute: 'CPN_082_NewBookingRequestDetail',
      actionParams: { requestId: created.id },
      data: {
        requestId: created.id,
        route: 'CPN_082_NewBookingRequestDetail',
        params: { requestId: created.id },
      },
      createdAt: new Date().toISOString(),
    });

    // 3. Emit booking_updated event for companion app cache invalidation
    this.notificationsGateway.emitBookingUpdated(dto.companionId, {
      requestId: created.id,
      status: 'pending',
    });

    this.logger.log(`[S2S] Internal booking request created: ${created.id} for companion ${dto.companionId}`);
    return {
      success: true,
      requestId: created.id,
      request: requestResponse,
    };
  }

  async modifyInternalRequest(bookingId: string, dto: ModifyInternalBookingRequestDto) {
    const start = dto.proposedStart ? new Date(dto.proposedStart) : undefined;
    const end = dto.proposedEnd ? new Date(dto.proposedEnd) : undefined;
    if ((start && !end) || (!start && end) || (start && end && end <= start)) {
      throw new BadRequestException('A valid start and end time are required together.');
    }
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException('At least one booking change is required.');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.bookingRequest.updateMany({
        where: { id: bookingId, status: 'pending', expiresAt: { gt: new Date() } },
        data: {
          ...(start && { proposedStart: start }),
          ...(end && { proposedEnd: end }),
          ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
          ...(dto.venueName !== undefined && { venueName: dto.venueName }),
          ...(dto.venueArea !== undefined && { venueArea: dto.venueArea }),
          ...(dto.venueCity !== undefined && { venueCity: dto.venueCity }),
          ...(dto.venueType !== undefined && { venueType: dto.venueType }),
          ...(dto.venueMeetingPoint !== undefined && { venueMeetingPoint: dto.venueMeetingPoint }),
          ...(dto.venueLandmark !== undefined && { venueLandmark: dto.venueLandmark }),
          ...(dto.estimatedEarning !== undefined && { estimatedEarning: dto.estimatedEarning }),
          ...(dto.customerNote !== undefined && { customerNote: dto.customerNote }),
        },
      });
      if (!result.count) {
        throw new ConflictException('Booking request is no longer pending or has expired.');
      }
      const request = await tx.bookingRequest.findUnique({ where: { id: bookingId } });
      if (!request) throw new NotFoundException('Booking request not found.');
      await tx.notification.create({
        data: {
          companionId: request.companionId,
          type: 'request',
          title: 'Booking Request Updated',
          body: 'The customer updated a pending booking request.',
          data: JSON.stringify({ requestId: bookingId }),
          isRead: false,
        },
      });
      return request;
    });
    this.notificationsGateway.emitNotification(updated.companionId, {
      notificationId: `updated-${updated.id}`,
      type: 'request',
      title: 'Booking Request Updated',
      body: 'A customer updated a pending booking request.',
      data: { requestId: updated.id },
    });
    return { success: true, request: this.toRequestResponse(updated) };
  }

  async respondToCustomerCounterOffer(bookingId: string, action: 'accept' | 'decline') {
    const request = await this.prisma.bookingRequest.findFirst({
      where: { id: bookingId, status: 'counter_proposed' },
      select: { companionId: true, expiresAt: true },
    });
    if (!request) throw new NotFoundException('Counter offer not found or already handled.');
    if (request.expiresAt <= new Date()) {
      throw new BadRequestException('This counter offer has expired.');
    }

    if (action === 'accept') {
      return this.acceptRequest(request.companionId, bookingId);
    }
    return this.declineRequest(
      request.companionId,
      bookingId,
      'Customer declined the counter-offer.',
    );
  }

  // ── POST /companion/requests/:requestId/accept ────────────────────────────
  async acceptRequest(companionId: string, requestId: string) {
    const acceptance = await this.prisma.$transaction(async (tx) => {
      // Serialize acceptance decisions per companion so two simultaneous requests
      // cannot both reserve overlapping time slots.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${companionId})::bigint)`;

      const req = await tx.bookingRequest.findFirst({
        where: { id: requestId, companionId, status: { in: ['pending', 'counter_proposed'] } },
      });
      if (!req) throw new NotFoundException('Pending booking request not found');
      const now = new Date();
      if (req.expiresAt <= now) throw new BadRequestException('This request has expired');

      const acceptedStart = req.status === 'counter_proposed'
        ? req.counterProposedStart ?? req.proposedStart
        : req.proposedStart;
      const acceptedEnd = req.status === 'counter_proposed'
        ? req.counterProposedEnd ?? req.proposedEnd
        : req.proposedEnd;
      const conflict = await tx.session.findFirst({
        where: {
          companionId,
          status: { notIn: ['completed', 'cancelled', 'no_show'] },
          scheduledStart: { lt: acceptedEnd },
          scheduledEnd: { gt: acceptedStart },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new ConflictException('This time overlaps another accepted companion booking.');
      }

      const claim = await tx.bookingRequest.updateMany({
        where: {
          id: requestId,
          companionId,
          status: req.status,
          expiresAt: { gt: now },
        },
        data: {
          status: 'accepted',
          respondedAt: now,
          proposedStart: acceptedStart,
          proposedEnd: acceptedEnd,
        },
      });
      if (claim.count !== 1) {
        throw new ConflictException('This booking request was already handled. Refresh and try again.');
      }
      const updatedReq = await tx.bookingRequest.findUniqueOrThrow({ where: { id: requestId } });
      const passCode = this.generatePassCode(req.customerInitials);

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
          scheduledStart: acceptedStart,
          scheduledEnd: acceptedEnd,
          durationMinutes: req.durationMinutes,
          language: req.language,
          baseEarning: req.estimatedEarning,
          bonusEarning: 0,
          estimatedTotal: req.estimatedEarning,
          sessionPassCode: passCode,
        },
      });

      const dbNotif = await tx.notification.create({
        data: {
          companionId,
          type: 'session',
          title: 'Booking Accepted ✓',
          body: `You accepted the booking from ${req.customerInitials} at ${req.venueName}. Session created.`,
          data: JSON.stringify({
            sessionId: newSession.id,
            requestId,
            route: 'CPN_097_SessionDetail',
            params: { sessionId: newSession.id },
          }),
          isRead: false,
        },
      });

      // Find and auto-decline any competing pending requests for this companion that overlap this confirmed slot
      const conflictingPendingRequests = await tx.bookingRequest.findMany({
        where: {
          companionId,
          id: { not: requestId },
          status: { in: ['pending', 'counter_proposed'] },
          proposedStart: { lt: acceptedEnd },
          proposedEnd: { gt: acceptedStart },
        },
      });

      if (conflictingPendingRequests.length > 0) {
        const autoDeclineReason = 'Companion accepted another confirmed booking for this time slot';
        await tx.bookingRequest.updateMany({
          where: {
            id: { in: conflictingPendingRequests.map((r) => r.id) },
          },
          data: {
            status: 'declined',
            declineReason: autoDeclineReason,
            respondedAt: now,
          },
        });

        for (const confReq of conflictingPendingRequests) {
          await tx.notification.create({
            data: {
              companionId,
              type: 'request',
              title: 'Overlapping Request Auto-Declined',
              body: `Request from ${confReq.customerInitials} was auto-declined because you confirmed another booking for this time slot.`,
              data: JSON.stringify({
                requestId: confReq.id,
                route: 'CPN_067_Inbox',
              }),
              isRead: false,
            },
          });
        }
      }

      return {
        updated: updatedReq,
        session: newSession,
        notif: dbNotif,
        sessionPassCode: passCode,
        acceptedStart,
        acceptedEnd,
        conflictingRequests: conflictingPendingRequests,
      };
    });
    const { updated, session, notif, sessionPassCode, acceptedStart, acceptedEnd, conflictingRequests } = acceptance as {
      updated: any;
      session: any;
      notif: any;
      sessionPassCode: string;
      acceptedStart: Date;
      acceptedEnd: Date;
      conflictingRequests: any[];
    };

    this.notificationsGateway.emitNotification(companionId, {
      notificationId: notif.id,
      type: 'session',
      category: 'session',
      priority: 'high',
      title: notif.title,
      body: notif.body,
      actionRoute: 'CPN_097_SessionDetail',
      actionParams: { sessionId: session.id },
      data: { sessionId: session.id, requestId, route: 'CPN_097_SessionDetail', params: { sessionId: session.id } },
      createdAt: new Date().toISOString(),
    });

    this.notificationsGateway.emitSessionUpdated(companionId, {
      sessionId: session.id,
      status: 'upcoming',
    });

    this.logger.log(`Request ${requestId} accepted → Session ${session.id} created`);

    // S2S cross-backend sync to Customer Backend for accepted booking
    await this.notifyCustomerBackendOfStatusUpdate(requestId, {
      status: 'accepted',
      passCode: sessionPassCode,
      companionId,
      sessionId: session.id,
      newStart: acceptedStart.toISOString(),
      newEnd: acceptedEnd.toISOString(),
    });

    // Notify customer backend for any auto-declined competing requests
    if (conflictingRequests && conflictingRequests.length > 0) {
      for (const confReq of conflictingRequests) {
        await this.notifyCustomerBackendOfStatusUpdate(confReq.id, {
          status: 'declined',
          reason: 'Companion accepted another confirmed booking for this time slot',
          companionId,
        });
        this.notificationsGateway.emitBookingUpdated(companionId, {
          requestId: confReq.id,
          status: 'declined',
        });
      }
    }

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
        data: JSON.stringify({ requestId, route: 'CPN_081_BookingRequestsInbox' }),
        isRead: false,
      },
    });
    this.notificationsGateway.emitNotification(companionId, {
      notificationId: notif.id,
      type: 'request',
      category: 'request',
      title: notif.title,
      body: notif.body,
      actionRoute: 'CPN_081_BookingRequestsInbox',
      actionParams: {},
      data: { requestId },
      createdAt: new Date().toISOString(),
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
    } catch {
      this.logger.warn('Error connecting to Customer Backend for booking status sync.');
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
    // 4-digit numeric start PIN matching audit spec CB-SEC-07 & mobile app inputs
    return randomInt(1000, 10000).toString();
  }
}
