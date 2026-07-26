import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Category } from '@prisma/client';
import {
  UpdateBasicProfileDto,
  UpdateBioDto,
  UpdateCategoriesDto,
  UpdateLanguagesDto,
  UpdateServiceAreasDto,
  UpdatePricingDto,
  ToggleAvailabilityDto,
  ReorderPhotosDto,
  ProfileSetupBulkDto,
  UpdatePhotoDto,
  UpdatePhotosDto,
  UpdateWorkPreferenceDto,
  UpdateCommActivityDto,
  UpdateVenuesDto,
  UpdateBoundariesDto,
} from './dto/profile.dto';

function mapToCategoryEnum(catStr: string): Category {
  if (!catStr || typeof catStr !== 'string') return Category.cafe_conversation;
  const s = catStr.toLowerCase();
  if (s.includes('cafe') || s.includes('conversation')) return Category.cafe_conversation;
  if (s.includes('walk') && !s.includes('wellness')) return Category.city_walk;
  if (s.includes('art') || s.includes('culture')) return Category.art_culture;
  if (s.includes('food') || s.includes('dining')) return Category.food_experience;
  if (s.includes('shop')) return Category.shopping_assistance;
  if (s.includes('event') || s.includes('concert')) return Category.events;
  if (s.includes('business') || s.includes('network')) return Category.business_networking;
  if (s.includes('book')) return Category.bookstore;
  if (s.includes('wellness')) return Category.wellness_walk;
  if (s.includes('movie') || s.includes('cinema')) return Category.movies;

  const validEnums = Object.values(Category) as string[];
  if (validEnums.includes(catStr)) return catStr as Category;
  return Category.cafe_conversation;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Update Work Preference ────────────────────────────────────────────────
  async updateWorkPreference(companionId: string, dto: UpdateWorkPreferenceDto) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { workPreferences: dto as any },
    });
    return { success: true, message: 'Work preferences updated successfully' };
  }

  // ─── Update Communication & Activity Preferences ────────────────────────────
  async updateCommActivity(companionId: string, dto: UpdateCommActivityDto) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { commActivityPrefs: dto as any },
    });
    return { success: true, message: 'Communication & activity preferences updated successfully' };
  }

  // ─── Update Public Venue Preferences ───────────────────────────────────────
  async updateVenues(companionId: string, dto: UpdateVenuesDto) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { venuePreferences: dto.venuePreferences ?? [] },
    });
    return { success: true, message: 'Venue preferences updated successfully' };
  }

  // ─── Update Boundaries & Safety Acceptance ──────────────────────────────────
  async updateBoundaries(companionId: string, dto: UpdateBoundariesDto) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { boundariesAccepted: dto.boundariesAccepted },
    });
    return { success: true, message: 'Boundaries acceptance updated successfully' };
  }

  // ── GET /companion/profile ─────────────────────────────────────────────────
  // Returns exact CompanionProfile interface from store.types.ts

  async getProfile(companionId: string) {
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      include: {
        serviceAreas: true,
        categories: true,
        languages: true,
        galleryPhotos: { orderBy: { sortOrder: 'asc' } },
        kyc: { select: { id: true, submittedAt: true, approvedAt: true, rejectedAt: true } },
      },
    });

    if (!companion) throw new NotFoundException('Companion not found');

    // Return EXACT CompanionProfile interface from store.types.ts
    return this.toProfileResponse(companion);
  }

  // ── PUT /companion/profile/photo ──────────────────────────────────────────

  async updatePhoto(companionId: string, dto: UpdatePhotoDto) {
    const companion = await this.prisma.companion.update({
      where: { id: companionId },
      data: { photoUrl: dto.photoUrl },
    });
    return this.toProfileResponse(companion);
  }

  // ── POST /companion/profile/setup-bulk ────────────────────────────────────

  async setupBulk(companionId: string, dto: ProfileSetupBulkDto) {
    // We use a Prisma transaction to ensure all these operations succeed or fail together
    return this.prisma.$transaction(async (tx) => {
      // 1. Update Bio and Interest Tags
      const companionUpdateData: any = {};
      if (dto.bio !== undefined) companionUpdateData.bio = dto.bio;
      if (dto.interestTags !== undefined) companionUpdateData.interestTags = dto.interestTags;

      if (Object.keys(companionUpdateData).length > 0) {
        await tx.companion.update({
          where: { id: companionId },
          data: companionUpdateData,
        });
      }

      // 2. Update Categories
      if (dto.categories !== undefined) {
        // Delete old categories
        await tx.companionCategory.deleteMany({
          where: { companionId },
        });

        if (dto.categories.length > 0) {
          // Insert new categories
          await tx.companionCategory.createMany({
            data: dto.categories.map((c: any) => ({
              companionId,
              category: c,
            })),
          });
        }
      }

      // 3. Update Languages
      if (dto.languages !== undefined) {
        // Delete old languages
        await tx.companionLanguage.deleteMany({
          where: { companionId },
        });

        if (dto.languages.length > 0) {
          await tx.companionLanguage.createMany({
            data: dto.languages.map((l: any) => ({
              companionId,
              language: typeof l === 'string' ? l : l.language,
              proficiency: typeof l === 'string' ? 'conversational' : (l.proficiency || 'conversational'),
            })),
          });
        }
      }

      // Return the updated profile (outside transaction for simplicity, or just success msg)
      return { success: true, message: 'Profile setup data saved successfully in bulk.' };
    });
  }

  // ── GET /companion/profile/preview ─────────────────────────────────────────

  async getPreview(companionId: string) {
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      include: {
        serviceAreas: true,
        categories: true,
        languages: true,
        galleryPhotos: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!companion) throw new NotFoundException('Companion not found');

    return {
      displayName: companion.displayName,
      bio: companion.bio,
      rating: companion.rating,
      totalSessions: companion.totalSessions,
      trustScore: companion.trustScore,
      languages: companion.languages.map((l) => l.language),
      categories: companion.categories.map((c) => c.category),
      serviceAreas: companion.serviceAreas.map((sa) => sa.area),
      photoUrl: companion.photoUrl,
      galleryPhotos: companion.galleryPhotos.map((p) => p.url),
    };
  }

  // ── GET /companion/profile/trust ─────────────────────────────────────────
  async getTrustDashboard(companionId: string) {
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      include: {
        badges: true,
        trustTasks: { where: { isCompleted: true } },
      },
    });
    
    if (!companion) throw new NotFoundException('Companion not found');

    return {
      score: companion.trustScore,
      responseRate: companion.responseRate,
      cancellationRate: companion.cancellationRate,
      lastUpdated: companion.updatedAt.toISOString(),
      completedTasks: companion.trustTasks.map((t) => t.taskId),
      unlockedBadges: companion.badges.map((b) => b.badgeKey),
    };
  }

  // ── POST /companion/profile/trust/task ───────────────────────────────────
  async completeTrustTask(companionId: string, dto: { taskId: string; points: number }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find if task is already completed
      const existing = await tx.trustTask.findFirst({
        where: { companionId, taskId: dto.taskId },
      });

      if (existing && existing.isCompleted) {
        return { success: true, message: 'Task already completed' };
      }

      // 2. Upsert the task completion
      if (existing) {
        await tx.trustTask.update({
          where: { id: existing.id },
          data: { isCompleted: true, completedAt: new Date() },
        });
      } else {
        await tx.trustTask.create({
          data: {
            companionId,
            taskId: dto.taskId,
            title: dto.taskId, // mock title
            description: '',
            category: 'general',
            points: dto.points,
            isCompleted: true,
            completedAt: new Date(),
          },
        });
      }

      // 3. Update Companion Trust Score
      const companion = await tx.companion.findUnique({ where: { id: companionId } });
      let newScore = Math.min((companion?.trustScore || 0) + dto.points, 100);

      await tx.companion.update({
        where: { id: companionId },
        data: { trustScore: newScore },
      });

      // 4. Issue a new badge if score reaches 100
      if (newScore === 100) {
        const badgeExists = await tx.companionBadge.findUnique({
          where: { companionId_badgeKey: { companionId, badgeKey: 'badge_elite' } },
        });
        if (!badgeExists) {
          await tx.companionBadge.create({
            data: {
              companionId,
              badgeKey: 'badge_elite',
              badgeName: 'Elite Companion',
            },
          });
        }
      }

      return { success: true, newScore };
    });
  }

  // ── PUT /companion/profile/basic ──────────────────────────────────────────

  async updateBasic(companionId: string, dto: UpdateBasicProfileDto) {
    const companion = await this.prisma.companion.update({
      where: { id: companionId },
      data: { ...dto },
      include: {
        serviceAreas: true,
        categories: true,
        languages: true,
        galleryPhotos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return this.toProfileResponse(companion);
  }

  // ── PUT /companion/profile/bio ────────────────────────────────────────────

  async updateBio(companionId: string, dto: UpdateBioDto) {
    const companion = await this.prisma.companion.update({
      where: { id: companionId },
      data: { bio: dto.bio },
      include: {
        serviceAreas: true,
        categories: true,
        languages: true,
        galleryPhotos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return this.toProfileResponse(companion);
  }

  // ── PUT /companion/profile/categories ─────────────────────────────────────

  async updateCategories(companionId: string, dto: UpdateCategoriesDto) {
    if (!dto.categories?.length) throw new BadRequestException('At least one category required');

    await this.prisma.companionCategory.deleteMany({ where: { companionId } });
    await this.prisma.companionCategory.createMany({
      data: dto.categories.map(cat => ({
        companionId,
        category: mapToCategoryEnum(cat),
      })),
    });

    return this.getProfile(companionId);
  }

  // ── PUT /companion/profile/languages ──────────────────────────────────────

  async updateLanguages(companionId: string, dto: UpdateLanguagesDto) {
    if (!dto.languages?.length) throw new BadRequestException('At least one language required');

    await this.prisma.companionLanguage.deleteMany({ where: { companionId } });
    await this.prisma.companionLanguage.createMany({
      data: dto.languages.map(l => ({
        companionId,
        language: l,
        proficiency: 'fluent',
      })),
    });

    return this.getProfile(companionId);
  }

  // ── PUT /companion/profile/service-areas ──────────────────────────────────

  async updateServiceAreas(companionId: string, dto: UpdateServiceAreasDto) {
    await this.prisma.$transaction(async (tx) => {
      if (dto.city !== undefined || dto.willingToTravel !== undefined) {
        const updateData: any = {};
        if (dto.city !== undefined) updateData.city = dto.city;
        if (dto.willingToTravel !== undefined) updateData.willingToTravel = dto.willingToTravel;
        
        await tx.companion.update({
          where: { id: companionId },
          data: updateData,
        });
      }

      const areasToUpdate = (dto as any).broadAreas ?? dto.serviceAreas;
      if (areasToUpdate !== undefined) {
        await tx.companionServiceArea.deleteMany({ where: { companionId } });
        if (areasToUpdate.length > 0) {
          const companion = await tx.companion.findUnique({ where: { id: companionId }, select: { city: true } });
          const currentCity = dto.city ?? companion?.city ?? '';
          
          await tx.companionServiceArea.createMany({
            data: areasToUpdate.map((area: string) => ({
              companionId,
              area,
              city: currentCity,
            })),
          });
        }
      }
    });

    return this.getProfile(companionId);
  }

  // ── PUT /companion/profile/pricing ────────────────────────────────────────

  async updatePricing(companionId: string, dto: UpdatePricingDto) {
    const data: any = {};
    if (dto.hourlyRate !== undefined) data.hourlyRate = dto.hourlyRate;
    if (dto.sessionDuration !== undefined) data.sessionDuration = dto.sessionDuration;

    const companion = await this.prisma.companion.update({
      where: { id: companionId },
      data,
      include: {
        serviceAreas: true, categories: true, languages: true,
        galleryPhotos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return this.toProfileResponse(companion);
  }

  // ── PUT /companion/profile/photos ─────────────────────────────────────────

  async updatePhotos(companionId: string, dto: UpdatePhotosDto) {
    if (dto.galleryPhotos !== undefined) {
      await this.prisma.$transaction(async (tx) => {
        if (dto.photoUrl !== undefined) {
          await tx.companion.update({
            where: { id: companionId },
            data: { photoUrl: dto.photoUrl },
          });
        }
        
        await tx.companionPhoto.deleteMany({
          where: { companionId },
        });

        if (dto.galleryPhotos.length > 0) {
          await tx.companionPhoto.createMany({
            data: dto.galleryPhotos.map((url, index) => ({
              companionId,
              url,
              sortOrder: index,
            })),
          });
        }
      });
    } else if (dto.photoUrl !== undefined) {
      await this.prisma.companion.update({
        where: { id: companionId },
        data: { photoUrl: dto.photoUrl },
      });
    }

    return this.getProfile(companionId);
  }

  // ── PUT /companion/profile/photos/reorder ─────────────────────────────────

  async reorderPhotos(companionId: string, dto: ReorderPhotosDto) {
    for (let i = 0; i < dto.photoIds.length; i++) {
      await this.prisma.companionPhoto.updateMany({
        where: { id: dto.photoIds[i], companionId },
        data: { sortOrder: i },
      });
    }
    const photos = await this.prisma.companionPhoto.findMany({
      where: { companionId },
      orderBy: { sortOrder: 'asc' },
    });
    return { galleryPhotos: photos.map(p => p.url) };
  }

  // ── PUT /companion/profile/availability ───────────────────────────────────

  async toggleAvailability(companionId: string, dto: ToggleAvailabilityDto) {
    const companion = await this.prisma.companion.update({
      where: { id: companionId },
      data: {
        isAvailable: dto.isAvailable,
        ...(dto.isOnline !== undefined && { isOnline: dto.isOnline }),
        ...(dto.isAvailable && { lastActiveAt: new Date() }),
      },
    });
    return {
      isAvailable: companion.isAvailable,
      isOnline: companion.isOnline,
      message: dto.isAvailable ? 'You are now available for bookings' : 'You are now unavailable',
    };
  }

  // ── POST /companion/profile/submit ────────────────────────────────────────

  async submitForReview(companionId: string) {
    // Validate completeness
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      include: { categories: true, languages: true, serviceAreas: true },
    });
    if (!companion) throw new NotFoundException('Companion not found');
    if (!companion.displayName) throw new BadRequestException('Display name is required');
    if (!companion.bio) throw new BadRequestException('Bio is required');
    if (!companion.categories.length) throw new BadRequestException('At least one category required');
    if (!companion.languages.length) throw new BadRequestException('At least one language required');
    if (!companion.hourlyRate) throw new BadRequestException('Hourly rate is required');

    const updated = await this.prisma.companion.update({
      where: { id: companionId },
      data: { profileStatus: 'submitted' },
    });

    // Also update KYC
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { submittedAt: new Date() },
      create: { companionId, submittedAt: new Date() },
    });

    return {
      profileStatus: updated.profileStatus,
      verificationStatus: updated.verificationStatus,
      message: 'Profile submitted for review. Our team will review within 2-3 business days.',
    };
  }

  // ── Private: map to CompanionProfile interface (store.types.ts) ──────────

  private toProfileResponse(companion: any) {
    return {
      companionId: companion.id,
      displayName: companion.displayName ?? '',
      maskedPhone: this.maskPhone(companion.phone),
      city: companion.city ?? '',
      serviceAreas: (companion.serviceAreas ?? []).map((a: any) => a.area),
      categories: (companion.categories ?? []).map((c: any) => c?.category ? String(c.category).toLowerCase() : ''),
      languages: (companion.languages ?? []).map((l: any) => l?.language ?? ''),
      bio: companion.bio ?? '',
      hourlyRate: companion.hourlyRate ? Number(companion.hourlyRate) : 0,
      sessionDuration: companion.sessionDuration ?? 90,
      profileStatus: companion.profileStatus ? String(companion.profileStatus).toLowerCase() : 'draft',
      verificationStatus: companion.verificationStatus ? String(companion.verificationStatus).toLowerCase() : 'not_started',
      trustScore: companion.trustScore ?? 0,
      trustLevel: companion.trustLevel ? String(companion.trustLevel).toLowerCase() : 'new',
      rating: companion.rating ? Number(companion.rating) : 0.0,
      totalReviews: companion.totalReviews ?? 0,
      totalSessions: companion.totalSessions ?? 0,
      isAvailable: companion.isAvailable ?? false,
      isOnline: companion.isOnline ?? false,
      photoUrl: companion.photoUrl ?? null,
      galleryPhotos: (companion.galleryPhotos ?? []).map((p: any) => p?.url).filter(Boolean),
      joinedAt: companion.createdAt ? new Date(companion.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return phone;
    const last4 = phone.slice(-4);
    const prefix = phone.slice(0, phone.indexOf(phone.replace(/^\+\d+\s?/, '')[0]));
    return `${prefix} ••••••${last4}`;
  }
}
