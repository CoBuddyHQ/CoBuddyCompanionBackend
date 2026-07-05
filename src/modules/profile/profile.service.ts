import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpdateBasicProfileDto,
  UpdateBioDto,
  UpdateCategoriesDto,
  UpdateLanguagesDto,
  UpdateServiceAreasDto,
  UpdatePricingDto,
  ToggleAvailabilityDto,
  ReorderPhotosDto,
} from './dto/profile.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private prisma: PrismaService) {}

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
        category: cat as any,
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
        language: l.language,
        proficiency: l.proficiency || 'fluent',
      })),
    });

    return this.getProfile(companionId);
  }

  // ── PUT /companion/profile/service-areas ──────────────────────────────────

  async updateServiceAreas(companionId: string, dto: UpdateServiceAreasDto) {
    await this.prisma.companionServiceArea.deleteMany({ where: { companionId } });
    if (dto.serviceAreas?.length) {
      await this.prisma.companionServiceArea.createMany({
        data: dto.serviceAreas.map(a => ({ companionId, ...a })),
      });
    }
    return this.getProfile(companionId);
  }

  // ── PUT /companion/profile/pricing ────────────────────────────────────────

  async updatePricing(companionId: string, dto: UpdatePricingDto) {
    const companion = await this.prisma.companion.update({
      where: { id: companionId },
      data: { hourlyRate: dto.hourlyRate as any },
      include: {
        serviceAreas: true, categories: true, languages: true,
        galleryPhotos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return this.toProfileResponse(companion);
  }

  // ── PUT /companion/profile/photos ─────────────────────────────────────────

  async updatePhotos(companionId: string, photoUrl: string) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { photoUrl },
    });
    return { message: 'Profile photo updated', photoUrl };
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
      data: { profileStatus: 'SUBMITTED' },
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

  // ── GET /companion/profile/preview ────────────────────────────────────────

  async getPreview(companionId: string) {
    return this.getProfile(companionId);
  }

  // ── Private: map to CompanionProfile interface (store.types.ts) ──────────

  private toProfileResponse(companion: any) {
    return {
      companionId: companion.id,
      displayName: companion.displayName ?? '',
      maskedPhone: this.maskPhone(companion.phone),
      city: companion.city ?? '',
      serviceAreas: (companion.serviceAreas ?? []).map((a: any) => a.area),
      categories: (companion.categories ?? []).map((c: any) => c.category.toLowerCase()),
      languages: (companion.languages ?? []).map((l: any) => l.language),
      bio: companion.bio ?? '',
      hourlyRate: companion.hourlyRate ? Number(companion.hourlyRate) : 0,
      profileStatus: companion.profileStatus.toLowerCase(),
      verificationStatus: companion.verificationStatus.toLowerCase(),
      trustScore: companion.trustScore,
      trustLevel: companion.trustLevel.toLowerCase(),
      rating: Number(companion.rating),
      totalReviews: companion.totalReviews,
      totalSessions: companion.totalSessions,
      isAvailable: companion.isAvailable,
      isOnline: companion.isOnline,
      photoUrl: companion.photoUrl ?? null,
      galleryPhotos: (companion.galleryPhotos ?? []).map((p: any) => p.url),
      joinedAt: companion.createdAt.toISOString(),
    };
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return phone;
    const last4 = phone.slice(-4);
    const prefix = phone.slice(0, phone.indexOf(phone.replace(/^\+\d+\s?/, '')[0]));
    return `${prefix} ••••••${last4}`;
  }
}
