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
const progress_engine_service_1 = require("../kyc/progress-engine.service");
const client_1 = require("@prisma/client");
function mapToCategoryEnum(catStr) {
    if (!catStr || typeof catStr !== 'string')
        return client_1.Category.cafe_conversation;
    const s = catStr.toLowerCase();
    if (s.includes('cafe') || s.includes('conversation'))
        return client_1.Category.cafe_conversation;
    if (s.includes('walk') && !s.includes('wellness'))
        return client_1.Category.city_walk;
    if (s.includes('art') || s.includes('culture'))
        return client_1.Category.art_culture;
    if (s.includes('food') || s.includes('dining'))
        return client_1.Category.food_experience;
    if (s.includes('shop'))
        return client_1.Category.shopping_assistance;
    if (s.includes('event') || s.includes('concert'))
        return client_1.Category.events;
    if (s.includes('business') || s.includes('network'))
        return client_1.Category.business_networking;
    if (s.includes('book'))
        return client_1.Category.bookstore;
    if (s.includes('wellness'))
        return client_1.Category.wellness_walk;
    if (s.includes('movie') || s.includes('cinema'))
        return client_1.Category.movies;
    const validEnums = Object.values(client_1.Category);
    if (validEnums.includes(catStr))
        return catStr;
    return client_1.Category.cafe_conversation;
}
let ProfileService = ProfileService_1 = class ProfileService {
    constructor(prisma, progressEngine) {
        this.prisma = prisma;
        this.progressEngine = progressEngine;
        this.logger = new common_1.Logger(ProfileService_1.name);
    }
    async updateWorkPreference(companionId, dto) {
        const dataToUpdate = { workPreferences: dto };
        if (Array.isArray(dto.venuePreferences)) {
            dataToUpdate.venuePreferences = dto.venuePreferences;
        }
        await this.prisma.companion.update({
            where: { id: companionId },
            data: dataToUpdate,
        });
        return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Work preferences updated successfully' };
    }
    async updateCommActivity(companionId, dto) {
        const dataToUpdate = { commActivityPrefs: dto };
        if (Array.isArray(dto.interests)) {
            dataToUpdate.interestTags = dto.interests;
        }
        await this.prisma.companion.update({
            where: { id: companionId },
            data: dataToUpdate,
        });
        return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Communication & activity preferences updated successfully' };
    }
    async updateVenues(companionId, dto) {
        await this.prisma.companion.update({
            where: { id: companionId },
            data: { venuePreferences: dto.venuePreferences ?? [] },
        });
        return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Venue preferences updated successfully' };
    }
    async updateBoundaries(companionId, dto) {
        await this.prisma.companion.update({
            where: { id: companionId },
            data: { boundariesAccepted: dto.boundariesAccepted },
        });
        return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Boundaries acceptance updated successfully' };
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
        return await this.toProfileResponse(companion);
    }
    async updatePhoto(companionId, dto) {
        const companion = await this.prisma.companion.update({
            where: { id: companionId },
            data: { photoUrl: dto.photoUrl },
        });
        return await this.toProfileResponse(companion);
    }
    async setupBulk(companionId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const companionUpdateData = {};
            if (dto.bio !== undefined)
                companionUpdateData.bio = dto.bio;
            if (dto.interestTags !== undefined)
                companionUpdateData.interestTags = dto.interestTags;
            if (Object.keys(companionUpdateData).length > 0) {
                await tx.companion.update({
                    where: { id: companionId },
                    data: companionUpdateData,
                });
            }
            if (dto.categories !== undefined) {
                await tx.companionCategory.deleteMany({
                    where: { companionId },
                });
                if (dto.categories.length > 0) {
                    await tx.companionCategory.createMany({
                        data: dto.categories.map((c) => ({
                            companionId,
                            category: c,
                        })),
                    });
                }
            }
            if (dto.languages !== undefined) {
                await tx.companionLanguage.deleteMany({
                    where: { companionId },
                });
                if (dto.languages.length > 0) {
                    await tx.companionLanguage.createMany({
                        data: dto.languages.map((l) => ({
                            companionId,
                            language: typeof l === 'string' ? l : l.language,
                            proficiency: typeof l === 'string' ? 'conversational' : (l.proficiency || 'conversational'),
                        })),
                    });
                }
            }
            return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Profile setup data saved successfully in bulk.' };
        });
    }
    async getPreview(companionId) {
        const companion = await this.prisma.companion.findUnique({
            where: { id: companionId },
            include: {
                serviceAreas: true,
                categories: true,
                languages: true,
                galleryPhotos: { orderBy: { sortOrder: 'asc' } },
            },
        });
        if (!companion)
            throw new common_1.NotFoundException('Companion not found');
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
    async getTrustDashboard(companionId) {
        const companion = await this.prisma.companion.findUnique({
            where: { id: companionId },
            include: {
                badges: true,
                trustTasks: { where: { isCompleted: true } },
            },
        });
        if (!companion)
            throw new common_1.NotFoundException('Companion not found');
        return {
            score: companion.trustScore,
            responseRate: companion.responseRate,
            cancellationRate: companion.cancellationRate,
            lastUpdated: companion.updatedAt.toISOString(),
            completedTasks: companion.trustTasks.map((t) => t.taskId),
            unlockedBadges: companion.badges.map((b) => b.badgeKey),
        };
    }
    async completeTrustTask(companionId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.trustTask.findFirst({
                where: { companionId, taskId: dto.taskId },
            });
            if (existing && existing.isCompleted) {
                return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Task already completed' };
            }
            if (existing) {
                await tx.trustTask.update({
                    where: { id: existing.id },
                    data: { isCompleted: true, completedAt: new Date() },
                });
            }
            else {
                await tx.trustTask.create({
                    data: {
                        companionId,
                        taskId: dto.taskId,
                        title: dto.taskId,
                        description: '',
                        category: 'general',
                        points: dto.points,
                        isCompleted: true,
                        completedAt: new Date(),
                    },
                });
            }
            const companion = await tx.companion.findUnique({ where: { id: companionId } });
            let newScore = Math.min((companion?.trustScore || 0) + dto.points, 100);
            await tx.companion.update({
                where: { id: companionId },
                data: { trustScore: newScore },
            });
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
            return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), newScore };
        });
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
        return await this.toProfileResponse(companion);
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
        return await this.toProfileResponse(companion);
    }
    async updateCategories(companionId, dto) {
        if (!dto.categories?.length)
            throw new common_1.BadRequestException('At least one category required');
        await this.prisma.companionCategory.deleteMany({ where: { companionId } });
        await this.prisma.companionCategory.createMany({
            data: dto.categories.map(cat => ({
                companionId,
                category: mapToCategoryEnum(cat),
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
                language: l,
                proficiency: 'fluent',
            })),
        });
        return this.getProfile(companionId);
    }
    async updateServiceAreas(companionId, dto) {
        await this.prisma.$transaction(async (tx) => {
            if (dto.city !== undefined || dto.willingToTravel !== undefined) {
                const updateData = {};
                if (dto.city !== undefined)
                    updateData.city = dto.city;
                if (dto.willingToTravel !== undefined)
                    updateData.willingToTravel = dto.willingToTravel;
                await tx.companion.update({
                    where: { id: companionId },
                    data: updateData,
                });
            }
            const areasToUpdate = dto.broadAreas ?? dto.serviceAreas;
            if (areasToUpdate !== undefined) {
                await tx.companionServiceArea.deleteMany({ where: { companionId } });
                if (areasToUpdate.length > 0) {
                    const companion = await tx.companion.findUnique({ where: { id: companionId }, select: { city: true } });
                    const currentCity = dto.city ?? companion?.city ?? '';
                    await tx.companionServiceArea.createMany({
                        data: areasToUpdate.map((area) => ({
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
    async updatePricing(companionId, dto) {
        const data = {};
        if (dto.hourlyRate !== undefined)
            data.hourlyRate = dto.hourlyRate;
        if (dto.sessionDuration !== undefined)
            data.sessionDuration = dto.sessionDuration;
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
    async updatePhotos(companionId, dto) {
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
        }
        else if (dto.photoUrl !== undefined) {
            await this.prisma.companion.update({
                where: { id: companionId },
                data: { photoUrl: dto.photoUrl },
            });
        }
        return this.getProfile(companionId);
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
        let companion = await this.prisma.companion.findUnique({
            where: { id: companionId },
            include: { categories: true, languages: true, serviceAreas: true },
        });
        if (!companion)
            throw new common_1.NotFoundException('Companion not found');
        if (!companion.categories.length) {
            await this.prisma.companionCategory.create({
                data: { companionId, category: 'cafe_conversation' },
            });
        }
        if (!companion.languages.length) {
            await this.prisma.companionLanguage.create({
                data: { companionId, language: 'English', proficiency: 'fluent' },
            });
        }
        if (!companion.hourlyRate) {
            await this.prisma.companion.update({
                where: { id: companionId },
                data: { hourlyRate: 500 },
            });
        }
        const updated = await this.prisma.companion.update({
            where: { id: companionId },
            data: {
                profileStatus: 'published',
                verificationStatus: 'approved'
            },
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
    async toProfileResponse(companion) {
        const onboardingStatus = await this.progressEngine.getOnboardingStatus(companion.id);
        return {
            companionId: companion.id,
            displayName: companion.displayName ?? '',
            tagline: companion.tagline ?? '',
            maskedPhone: this.maskPhone(companion.phone),
            city: companion.city ?? '',
            serviceAreas: (companion.serviceAreas ?? []).map((a) => a.area),
            categories: (companion.categories ?? []).map((c) => c?.category ? String(c.category).toLowerCase() : ''),
            languages: (companion.languages ?? []).map((l) => l?.language ?? ''),
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
            joinedAt: companion.createdAt ? new Date(companion.createdAt).toISOString() : new Date().toISOString(),
            onboardingStatus,
            completedModules: onboardingStatus.completedModules,
            pendingModules: onboardingStatus.pendingModules,
            resumeRoute: onboardingStatus.resumeRoute,
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, progress_engine_service_1.ProgressEngineService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map