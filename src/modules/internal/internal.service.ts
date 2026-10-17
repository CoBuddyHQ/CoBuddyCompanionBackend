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
      },
    });

    if (!companion) {
      throw new NotFoundException(`Companion with ID ${id} not found or not currently published`);
    }

    return this.sanitizeCompanionPublic(companion);
  }

  // ── POST /api/v1/internal/booking-requests ──────────────────────────────────
  private sanitizeCompanionPublic(c: any) {
    const hourlyRate = c.hourlyRate === null || c.hourlyRate === undefined ? null : Number(c.hourlyRate);

    const availabilitySlots = (c.weeklySchedules || []).map((ws: any) => ({
      day: ws.day,
      active: ws.active,
      times: ws.times,
    }));

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
    };
  }

}
