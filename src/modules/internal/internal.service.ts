import { Injectable, NotFoundException, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InternalCompanionQueryDto } from './dto/internal.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  // ── GET /api/v1/internal/companions ─────────────────────────────────────────
  async getCompanions(query: InternalCompanionQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      accountStatus: 'active',
      verificationStatus: 'approved',
      profileStatus: { in: ['approved', 'published'] },
    };

    if (query.city) {
      whereClause.city = { contains: query.city, mode: 'insensitive' };
    }
    if (query.gender) {
      whereClause.gender = { equals: query.gender, mode: 'insensitive' };
    }
    if (query.search) {
      whereClause.OR = [
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { tagline: { contains: query.search, mode: 'insensitive' } },
        { bio: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) {
      whereClause.categories = {
        some: {
          category: query.category as any,
        },
      };
}
    const [companions, total] = await Promise.all([
      this.prisma.companion.findMany({
        where: whereClause,
        include: {
          serviceAreas: true,
          categories: true,
          languages: true,
          galleryPhotos: { orderBy: { sortOrder: 'asc' } },
          weeklySchedules: true,
          customSlots: true,
        },
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      this.prisma.companion.count({ where: whereClause }),
    ]);

    this.logger.log(`Matched ${companions.length} published companions from ${total} eligible records.`);

    const sanitized = companions.map((c) => this.sanitizeCompanionPublic(c));

    return {
      companions: sanitized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── GET /api/v1/internal/companions/:id ─────────────────────────────────────
  async getCompanionById(id: string) {
    const companion = await this.prisma.companion.findFirst({
      where: {
        id,
        accountStatus: 'active',
        verificationStatus: 'approved',
        profileStatus: 'published',
      },
      include: {
        serviceAreas: true,
        categories: true,
        languages: true,
        galleryPhotos: { orderBy: { sortOrder: 'asc' } },
        weeklySchedules: true,
        customSlots: true,
        reviews: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!companion) {
      throw new NotFoundException(`Companion with ID ${id} not found or not currently published`);
    }

    return this.sanitizeCompanionPublic(companion);
  }

  // ── POST /api/v1/internal/companions/:id/reviews ───────────────────────────
  async createInternalReview(companionId: string, dto: any) {
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
    });
    if (!companion) {
      throw new NotFoundException(`Companion with ID ${companionId} not found`);
    }

    // Try finding the session by sessionId or by requestId (which matches bookingId)
    const session = await this.prisma.session.findFirst({
      where: {
        OR: [
          ...(dto.sessionId ? [{ id: dto.sessionId }] : []),
          ...(dto.bookingId ? [{ requestId: dto.bookingId }] : []),
          ...(dto.bookingId ? [{ id: dto.bookingId }] : []),
        ],
      },
    });

    const targetSessionId = session?.id || dto.sessionId || dto.bookingId;
    const category = session?.category || 'cafe_conversation';
    const sessionDate = session?.scheduledStart || new Date();
    const durationMinutes = session?.durationMinutes || 60;
    const customerInitials = dto.customerInitials || session?.customerInitials || 'C.U.';
    const highlights = dto.highlights || dto.tags || [];
    const comment = dto.comment || dto.text || '';
    const ratingInt = Math.max(1, Math.min(5, Math.round(Number(dto.rating) || 5)));

    // Upsert the review in companion DB
    const review = await this.prisma.companionReview.upsert({
      where: { sessionId: targetSessionId },
      update: {
        customerInitials,
        rating: ratingInt,
        highlights,
        comment,
        isPublic: true,
      },
      create: {
        companionId,
        sessionId: targetSessionId,
        customerInitials,
        rating: ratingInt,
        isPublic: true,
        highlights,
        comment,
        sessionCategory: category as any,
        sessionDate,
        durationMinutes,
      },
    });

    // Recalculate average rating and total reviews for the companion
    const agg = await this.prisma.companionReview.aggregate({
      where: { companionId, isPublic: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const newRating = Number((agg._avg.rating ?? 5.0).toFixed(1));
    const totalReviews = agg._count.rating;

    await this.prisma.companion.update({
      where: { id: companionId },
      data: {
        rating: newRating,
        totalReviews,
      },
    });

    this.logger.log(
      `[Companion Review] Created review ${review.id} for companion ${companionId} | New Rating: ${newRating} | Total Reviews: ${totalReviews}`,
    );

    return {
      success: true,
      reviewId: review.id,
      rating: newRating,
      totalReviews,
    };
  }

  // ── SANITIZE PUBLIC COMPANION PROFILE ─────────────────────────────────────
  private sanitizeCompanionPublic(c: any) {
    const hourlyRate = c.hourlyRate === null || c.hourlyRate === undefined ? null : Number(c.hourlyRate);

    const availabilitySlots = (c.weeklySchedules || []).map((ws: any) => ({
      day: ws.day,
      active: ws.active,
      times: ws.times,
    }));

    const rawReviews = c.reviews || [];
    const reviewAvg = Number(c.rating) || 5.0;
    const reviewCount = c.totalReviews || rawReviews.length;

    const formattedReviews = {
      average: reviewAvg > 0 ? reviewAvg : 5.0,
      count: reviewCount,
      categories: {
        punctuality: 5.0,
        communication: 5.0,
        behavior: 4.9,
      },
      items: rawReviews.map((r: any) => ({
        id: r.id,
        author: r.customerInitials || 'Customer',
        date: r.sessionDate ? new Date(r.sessionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        activity: r.sessionCategory || 'Session',
        text: r.comment || '',
        rating: r.rating,
        highlights: r.highlights || [],
      })),
    };

    return {
      id: c.id,
      displayName: c.displayName,
      name: c.displayName,
      tagline: c.tagline,
      bio: c.bio,
      gender: c.gender,
      city: c.city,
      hourlyRate,
      sessionDuration: c.sessionDuration,
      rating: Number(c.rating),
      totalReviews: c.totalReviews,
      totalSessions: c.totalSessions,
      isAvailable: c.isAvailable,
      isOnline: c.isOnline,
      photoUrl: c.photoUrl || null,
      serviceAreas: (c.serviceAreas || []).map((sa: any) => ({
        id: sa.id,
        area: sa.area,
        city: sa.city,
      })),
      categories: (c.categories || []).map((cat: any) => cat.category),
      languages: (c.languages || []).map((l: any) => ({
        language: l.language,
        proficiency: l.proficiency,
      })),
      galleryPhotos: (c.galleryPhotos || []).map((p: any) => ({
        id: p.id,
        url: p.url,
        sortOrder: p.sortOrder,
      })),
      availabilitySlots,
      reviews: formattedReviews,
    };
  }

  // ── S2S: COMPLETE SESSION BY BOOKING ID ──────────────────────────────────────
  async completeSessionByBooking(bookingId: string, payload?: { tip?: number; notes?: string }) {
    const session = await this.prisma.session.findFirst({
      where: {
        OR: [{ requestId: bookingId }, { id: bookingId }],
      },
    });

    if (!session) {
      throw new NotFoundException(`Session for booking ${bookingId} not found`);
    }

    if (session.status === 'completed') {
      return { success: true, alreadyCompleted: true, session };
    }

    const confirmed = Number(session.estimatedTotal);
    const updated = await this.prisma.session.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        checkOutTime: new Date(),
        completedAt: new Date(),
        confirmedEarning: confirmed,
        notes: payload?.notes || (session.notes ? `${session.notes}\nCompleted by customer` : 'Completed by customer'),
      },
    });

    // Finalize companion earnings idempotently
    const existingTx = await this.prisma.earningsTransaction.findFirst({
      where: { sessionId: session.id, type: 'session_earning' },
    });
    if (!existingTx) {
      await this.prisma.earningsTransaction.create({
        data: {
          companionId: session.companionId,
          sessionId: session.id,
          type: 'session_earning',
          status: 'pending_review',
          amount: confirmed,
          customerInitials: session.customerInitials,
          description: `Session: ${session.category.replace(/_/g, ' ')} — ${session.venueName}`,
          payoutEligibleAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      await this.prisma.companion.update({
        where: { id: session.companionId },
        data: { totalSessions: { increment: 1 } },
      });

      await this.prisma.notification.create({
        data: {
          companionId: session.companionId,
          type: 'payout' as any,
          title: `Session Completed — ₹${confirmed} Earned 🎉`,
          body: `Your earnings of ₹${confirmed} are now in 48h review.`,
          isRead: false,
        },
      }).catch(() => {});
    }

    try {
      this.notificationsGateway?.emitSessionUpdated(session.companionId, {
        sessionId: session.id,
        status: 'completed',
      });
    } catch {}

    this.logger.log(`[S2S] Session ${session.id} for booking ${bookingId} completed by customer.`);
    return { success: true, session: updated };
  }

  // ── S2S: EXTEND SESSION BY BOOKING ID ────────────────────────────────────────
  async extendSessionByBooking(_bookingId: string, extraMinutes: number) {
    if (!Number.isInteger(extraMinutes) || extraMinutes < 30 || extraMinutes > 180) {
      throw new BadRequestException('Extension must be 30–180 minutes');
    }
    throw new ServiceUnavailableException(
      'Internal session extension is disabled until customer approval and verified payment are available. No session or earnings state was changed.',
    );
  }

  // ── S2S: Admin Verification Decision (Approve / Reject) ──
  async updateVerificationDecision(companionId: string, payload: { status: 'approved' | 'rejected'; reason?: string }) {
    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    if (!companion) throw new NotFoundException('Companion not found');

    const isApproved = payload.status === 'approved';
    const updated = await this.prisma.companion.update({
      where: { id: companionId },
      data: {
        verificationStatus: isApproved ? 'approved' : 'rejected',
        profileStatus: isApproved ? 'published' : 'draft',
      },
    });

    // Also update companionKYC status if exists
    await this.prisma.companionKYC.updateMany({
      where: { companionId },
      data: {
        rejectionReason: isApproved ? null : (payload.reason || 'Verification rejected by administrator'),
        rejectedAt: isApproved ? null : new Date(),
      },
    }).catch(() => {});

    // Notify companion
    const notif = await this.prisma.notification.create({
      data: {
        companionId,
        type: 'system',
        title: isApproved ? 'Profile Verified & Published! 🎉' : 'Verification Update',
        body: isApproved
          ? 'Congratulations! Your profile has been approved and is now live for bookings.'
          : `Your verification submission was not approved: ${payload.reason || 'Please check requirements and re-apply.'}`,
        isRead: false,
      },
    }).catch(() => null);

    if (notif) {
      try {
        this.notificationsGateway?.emitNotification(companionId, notif);
      } catch {}
    }

    this.logger.log(`[S2S Admin] Verification decision for companion ${companionId}: ${payload.status}`);
    return { success: true, companion: updated };
  }

  // ── S2S: Admin Ban / Unban Companion ──
  async updateBanStatus(companionId: string, payload: { isBanned: boolean; reason?: string }) {
    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    if (!companion) throw new NotFoundException('Companion not found');

    const newStatus = payload.isBanned ? 'suspended' : 'active';
    const updated = await this.prisma.companion.update({
      where: { id: companionId },
      data: {
        accountStatus: newStatus,
      },
    });

    if (payload.isBanned) {
      // Immediately revoke all active refresh tokens to force logout
      await this.prisma.refreshToken.updateMany({
        where: { companionId, isRevoked: false },
        data: { isRevoked: true },
      }).catch(() => {});

      // Notify companion via push/in-app
      const notif = await this.prisma.notification.create({
        data: {
          companionId,
          type: 'safety',
          title: 'Account Suspended',
          body: `Your account has been suspended: ${payload.reason || 'Violation of CoBuddy policies.'}`,
          isRead: false,
        },
      }).catch(() => null);

      if (notif) {
        try {
          this.notificationsGateway?.emitNotification(companionId, notif);
        } catch {}
      }
    }

    this.logger.log(`[S2S Admin] Ban status for companion ${companionId} set to: ${newStatus}`);
    return { success: true, accountStatus: newStatus };
  }
}
