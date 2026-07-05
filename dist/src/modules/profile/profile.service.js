"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProfileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProfileService = ProfileService_1 = class ProfileService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ProfileService_1.name);
    }
    async getProfile(companionId) {
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
        if (!companion)
            throw new common_1.NotFoundException('Companion not found');
        return this.toProfileResponse(companion);
    }
    async updateBasic(companionId, dto) {
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
    async updateBio(companionId, dto) {
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
    async updateCategories(companionId, dto) {
        if (!dto.categories?.length)
            throw new common_1.BadRequestException('At least one category required');
        await this.prisma.companionCategory.deleteMany({ where: { companionId } });
        await this.prisma.companionCategory.createMany({
            data: dto.categories.map(cat => ({
                companionId,
                category: cat,
            })),
        });
        return this.getProfile(companionId);
    }
    async updateLanguages(companionId, dto) {
        if (!dto.languages?.length)
            throw new common_1.BadRequestException('At least one language required');
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
    async updateServiceAreas(companionId, dto) {
        await this.prisma.companionServiceArea.deleteMany({ where: { companionId } });
        if (dto.serviceAreas?.length) {
            await this.prisma.companionServiceArea.createMany({
                data: dto.serviceAreas.map(a => ({ companionId, ...a })),
            });
        }
        return this.getProfile(companionId);
    }
    async updatePricing(companionId, dto) {
        const companion = await this.prisma.companion.update({
            where: { id: companionId },
            data: { hourlyRate: dto.hourlyRate },
            include: {
                serviceAreas: true, categories: true, languages: true,
                galleryPhotos: { orderBy: { sortOrder: 'asc' } },
            },
        });
        return this.toProfileResponse(companion);
    }
    async updatePhotos(companionId, photoUrl) {
        await this.prisma.companion.update({
            where: { id: companionId },
            data: { photoUrl },
        });
        return { message: 'Profile photo updated', photoUrl };
    }
    async reorderPhotos(companionId, dto) {
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
    async toggleAvailability(companionId, dto) {
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
    async submitForReview(companionId) {
        const companion = await this.prisma.companion.findUnique({
            where: { id: companionId },
            include: { categories: true, languages: true, serviceAreas: true },
        });
        if (!companion)
            throw new common_1.NotFoundException('Companion not found');
        if (!companion.displayName)
            throw new common_1.BadRequestException('Display name is required');
        if (!companion.bio)
            throw new common_1.BadRequestException('Bio is required');
        if (!companion.categories.length)
            throw new common_1.BadRequestException('At least one category required');
        if (!companion.languages.length)
            throw new common_1.BadRequestException('At least one language required');
        if (!companion.hourlyRate)
            throw new common_1.BadRequestException('Hourly rate is required');
        const updated = await this.prisma.companion.update({
            where: { id: companionId },
            data: { profileStatus: 'SUBMITTED' },
        });
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
    async getPreview(companionId) {
        return this.getProfile(companionId);
    }
    toProfileResponse(companion) {
        return {
            companionId: companion.id,
            displayName: companion.displayName ?? '',
            maskedPhone: this.maskPhone(companion.phone),
            city: companion.city ?? '',
            serviceAreas: (companion.serviceAreas ?? []).map((a) => a.area),
            categories: (companion.categories ?? []).map((c) => c.category.toLowerCase()),
            languages: (companion.languages ?? []).map((l) => l.language),
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
            galleryPhotos: (companion.galleryPhotos ?? []).map((p) => p.url),
            joinedAt: companion.createdAt.toISOString(),
        };
    }
    maskPhone(phone) {
        if (!phone || phone.length < 4)
            return phone;
        const last4 = phone.slice(-4);
        const prefix = phone.slice(0, phone.indexOf(phone.replace(/^\+\d+\s?/, '')[0]));
        return `${prefix} ••••••${last4}`;
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = ProfileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map