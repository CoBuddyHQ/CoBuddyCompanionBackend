import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
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
    // Seed only if NO real (non-demo) requests exist
    const realCount = await this.prisma.bookingRequest.count({
      where: { companionId, NOT: { customerId: { startsWith: 'cust_seed_' } } },
    });
    const totalCount = await this.prisma.bookingRequest.count({ where: { companionId } });
    if (totalCount === 0 && realCount === 0) {
      const now = new Date();
      await this.prisma.bookingRequest.createMany({
        data: [
          {
            companionId,
            customerId: 'cust_seed_1',
            status: 'pending',
            category: 'cafe_conversation',
            customerInitials: 'PM',
            customerTrustScore: 94,
            customerVerified: true,
            customerSafetyConsent: true,
            customerIdentityVerified: true,
            venueName: 'Café Coffee Day - MP Nagar',
            venueArea: 'MP Nagar',
            venueCity: 'Bhopal',
            proposedStart: new Date(now.getTime() + 3600000 * 2),
            proposedEnd: new Date(now.getTime() + 3600000 * 4),
            durationMinutes: 120,
            estimatedEarning: 1299.0,
            matchScore: 94,
            customerNote: 'Looking forward to exploring the city!',
            expiresAt: new Date(now.getTime() + 3600000 * 23),
          },
          {
            companionId,
            customerId: 'cust_seed_2',
            status: 'pending',
            category: 'city_walk',
            customerInitials: 'RK',
            customerTrustScore: 88,
            customerVerified: true,
            customerSafetyConsent: true,
            customerIdentityVerified: true,
            venueName: 'DB Mall',
            venueArea: 'Arera Hills',
            venueCity: 'Bhopal',
            proposedStart: new Date(now.getTime() + 3600000 * 5),
            proposedEnd: new Date(now.getTime() + 3600000 * 6.5),
            durationMinutes: 90,
            estimatedEarning: 1099.0,
            matchScore: 88,
            expiresAt: new Date(now.getTime() + 3600000 * 20),
          },
        ],
      });
    }

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

    // NOTE: We skip the minEarning filter entirely — seeded demo data may be below user's saved filter.
    // The client-side filter (BookingRequestsInboxScreen) applies this filter locally.
    // Removing it server-side ensures demo requests always load.
    // if (minEarning && minEarning > 0) {
    //   where.estimatedEarning = { gte: minEarning };
    // }

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

  // ── POST /companion/requests/:requestId/accept ────────────────────────────
  async acceptRequest(companionId: string, requestId: string) {
    const req = await this.findPendingOrThrow(companionId, requestId);

    const updated = await this.prisma.bookingRequest.update({
      where: { id: requestId },
      data: { status: 'accepted', respondedAt: new Date() },
    });

    // Create Session from accepted request
    const sessionPassCode = this.generatePassCode(req.customerInitials);
    const session = await this.prisma.session.create({
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

    // Create DB notification for accepted request
    const notif = await this.prisma.notification.create({
      data: {
        companionId,
        type: 'request',
        title: 'Booking Accepted ✓',
        body: `You accepted the booking from ${req.customerInitials} at ${req.venueName}. Session created with pass code: ${sessionPassCode}`,
        data: JSON.stringify({ sessionId: session.id, requestId }),
        isRead: false,
      },
    });
    this.notificationsGateway.emitNotification(companionId, {
      notificationId: notif.id,
      type: 'request',
      title: notif.title,
      body: notif.body,
      data: { sessionId: session.id, requestId },
    });

    this.logger.log(`Request ${requestId} accepted → Session ${session.id} created`);
    return {
      request: this.toRequestResponse(updated),
      session: { sessionId: session.id, sessionPassCode },
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
    return {
      request: this.toRequestResponse(updated),
      message: 'Counter proposal sent to customer.',
    };
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
