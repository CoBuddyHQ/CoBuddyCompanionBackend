import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateInternalBookingRequestDto, InternalCompanionQueryDto } from './dto/internal.dto';

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

    const allComps = await this.prisma.companion.findMany({ select: { id: true, displayName: true, accountStatus: true, verificationStatus: true, profileStatus: true } });
    this.logger.log(`[InternalService] Total companions in DB: ${allComps.length}. Sample: ${JSON.stringify(allComps[0] || {})}`);

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

    this.logger.log(`[InternalService] Matched companions: ${companions.length} of total ${total}`);

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
      },
    });

    if (!companion) {
      throw new NotFoundException(`Companion with ID ${id} not found or not currently published`);
    }

    return this.sanitizeCompanionPublic(companion);
  }

  // ── GET /api/v1/internal/campaigns ──────────────────────────────────────────
  async getCampaigns() {
    const now = new Date();

    // Authoritative campaign catalog for customer applications
    const catalog = [
      {
        id: 'camp_diwali_2026',
        title: 'Festive Gathering Companion Offer',
        message: 'Enjoy flat 20% off on all verified companions for Diwali gatherings and city walks.',
        category: 'PROMOTION',
        audience: 'customer',
        status: 'published',
        startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        bannerUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
        actionUrl: '/discovery/campaigns/festive-offer',
      },
      {
        id: 'camp_weekend_walk',
        title: 'Weekend City Walk Special',
        message: 'Book a 2-hour historic city walk and receive an extra 30-minute cafe extension on us.',
        category: 'PROMOTION',
        audience: 'customer',
        status: 'published',
        startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        bannerUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800',
        actionUrl: '/discovery/campaigns/weekend-walk',
      },
      {
        id: 'camp_staff_internal_2026',
        title: 'Internal Ops Meeting',
        message: 'Companion staff sync meeting scheduled at 9 PM.',
        category: 'INTERNAL',
        audience: 'internal_only',
        status: 'published',
        startsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'camp_expired_summer',
        title: 'Summer Splash 2026',
        message: 'Old seasonal deal expired.',
        category: 'PROMOTION',
        audience: 'customer',
        status: 'published',
        startsAt: '2026-04-01T00:00:00.000Z',
        endsAt: '2026-05-01T00:00:00.000Z',
      },
      {
        id: 'camp_future_new_year',
        title: 'New Year Countdown Special',
        message: 'Celebrate New Year Eve with curated companions.',
        category: 'PROMOTION',
        audience: 'customer',
        status: 'published',
        startsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'camp_draft_promotions',
        title: 'Unreleased Draft Promo',
        message: 'Internal review only.',
        category: 'PROMOTION',
        audience: 'customer',
        status: 'draft',
        startsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Strict security and freshness filtering:
    // 1. status === 'published'
    // 2. audience === 'customer' or 'all'
    // 3. active window: startsAt <= now <= endsAt
    const activeCustomerCampaigns = catalog.filter((c) => {
      if (c.status !== 'published') return false;
      const aud = c.audience?.toLowerCase();
      if (aud !== 'customer' && aud !== 'all') return false;
      const start = new Date(c.startsAt);
      const end = new Date(c.endsAt);
      if (start > now || end < now) return false;
      return true;
    });

    return {
      success: true,
      campaigns: activeCustomerCampaigns.map((c) => ({
        id: c.id,
        title: c.title,
        message: c.message,
        category: c.category,
        targetAudience: 'CUSTOMERS',
        bannerUrl: (c as any).bannerUrl || null,
        actionUrl: (c as any).actionUrl || null,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
      })),
    };
  }

  // ── POST /api/v1/internal/booking-requests ──────────────────────────────────
  async createBookingRequest(dto: CreateInternalBookingRequestDto) {
    const proposedStart = new Date(dto.proposedStart);
    const proposedEnd = new Date(dto.proposedEnd);

    // 1. Check double-booking conflict (409 Conflict)
    const conflictingSession = await this.prisma.session.findFirst({
      where: {
        companionId: dto.companionId,
        status: { in: ['upcoming', 'pre_arrival', 'checked_in', 'active', 'extending'] },
        scheduledStart: { lt: proposedEnd },
        scheduledEnd: { gt: proposedStart },
      },
    });

    if (conflictingSession) {
      this.logger.warn(
        `Double-booking conflict detected for companion ${dto.companionId} between ${proposedStart.toISOString()} and ${proposedEnd.toISOString()}`
      );
      throw new ConflictException(
        `Companion has an overlapping active session during the requested time window (409 Conflict)`
      );
    }

    const companion = await this.prisma.companion.findUnique({
      where: { id: dto.companionId },
    });
    if (!companion) {
      throw new NotFoundException(`Companion ${dto.companionId} not found`);
    }

    // 2. Persist real BookingRequest
    const created = await this.prisma.bookingRequest.create({
      data: {
        ...(dto.bookingId ? { id: dto.bookingId } : {}),
        companionId: dto.companionId,
        customerId: dto.customerId,
        status: 'pending',
        category: this.mapToCategoryEnum(dto.category),
        customerInitials: dto.customerInitials || 'C.U.',
        customerTrustScore: dto.customerTrustScore || 85,
        customerVerified: dto.customerVerified ?? true,
        customerSessionCount: 0,
        customerSafetyConsent: true,
        customerIdentityVerified: dto.customerVerified ?? true,
        venueName: dto.venueName || 'Public Venue',
        venueArea: dto.venueArea || '',
        venueCity: dto.venueCity || '',
        venueType: dto.venueType || 'PUBLIC',
        venueMeetingPoint: dto.venueMeetingPoint || 'Main Entrance',
        venueLandmark: dto.venueLandmark || '',
        isVenueApproved: true,
        proposedStart,
        proposedEnd,
        durationMinutes: dto.durationMinutes || 60,
        language: dto.language || 'Hindi',
        estimatedEarning: dto.estimatedEarning || Number(companion.hourlyRate || 500),
        customerNote: dto.customerNote,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // 3. Emit real-time notification to Companion
    const notif = await this.prisma.notification.create({
      data: {
        companionId: dto.companionId,
        type: 'request',
        title: 'New Booking Request 🔔',
        body: `You received a new booking request from ${dto.customerInitials || 'Customer'} at ${dto.venueName || 'Public Venue'}.`,
        data: JSON.stringify({ requestId: created.id, customerBookingId: dto.bookingId }),
        isRead: false,
      },
    });

    this.notificationsGateway.emitNotification(dto.companionId, {
      notificationId: notif.id,
      type: 'request',
      title: notif.title,
      body: notif.body,
      data: { requestId: created.id, customerBookingId: dto.bookingId },
    });

    this.logger.log(`[Internal S2S] BookingRequest ${created.id} created for companion ${dto.companionId}`);

    return {
      success: true,
      requestId: created.id,
      companionId: created.companionId,
      customerId: created.customerId,
      status: created.status,
      proposedStart: created.proposedStart.toISOString(),
      proposedEnd: created.proposedEnd.toISOString(),
      estimatedEarning: Number(created.estimatedEarning),
      createdAt: created.createdAt.toISOString(),
    };
  }

  // ── Helper: Public Safe Companion Sanitizer ─────────────────────────────────
  private sanitizeCompanionPublic(c: any) {
    const hourlyRate = c.hourlyRate ? Number(c.hourlyRate) : 500;
    const rating = c.rating ? Number(c.rating) : 5.0;

    const availabilitySlots = (c.weeklySchedules || []).map((ws: any) => ({
      day: ws.day,
      active: ws.active,
      times: ws.times,
    }));

    return {
      id: c.id,
      displayName: c.displayName || 'CoBuddy Companion',
      name: c.displayName || 'CoBuddy Companion',
      tagline: c.tagline || 'Curated companion for city experiences',
      bio: c.bio || '',
      gender: c.gender || 'Not specified',
      city: c.city || 'Mumbai',
      hourlyRate,
      sessionDuration: c.sessionDuration || 90,
      rating,
      totalReviews: c.totalReviews || 0,
      totalSessions: c.totalSessions || 0,
      isAvailable: c.isAvailable ?? true,
      isOnline: c.isOnline ?? false,
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
    };
  }

  private mapToCategoryEnum(cat?: string): any {
    const valid = [
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
    const norm = cat.toLowerCase().replace(/[-\s]+/g, '_');
    if (valid.includes(norm)) return norm;
    if (norm.includes('walk') || norm.includes('city')) return 'city_walk';
    if (norm.includes('food') || norm.includes('dine')) return 'food_experience';
    if (norm.includes('art') || norm.includes('museum')) return 'art_culture';
    if (norm.includes('shop')) return 'shopping_assistance';
    if (norm.includes('event')) return 'events';
    if (norm.includes('movie')) return 'movies';
    return 'cafe_conversation';
  }
}
