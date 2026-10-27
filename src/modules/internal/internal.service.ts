import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InternalCompanionQueryDto } from './dto/internal.dto';

@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name);

  constructor(private prisma: PrismaService) {}

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

}
