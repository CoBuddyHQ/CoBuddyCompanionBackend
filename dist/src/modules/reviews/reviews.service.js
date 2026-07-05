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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toReviewResponse(r) {
        return {
            reviewId: r.id,
            sessionId: r.sessionId,
            customerInitials: r.customerInitials,
            rating: r.rating,
            isPublic: r.isPublic,
            highlights: r.highlights,
            comment: r.comment ?? null,
            sessionCategory: r.sessionCategory.toLowerCase(),
            sessionDate: r.sessionDate.toISOString().split('T')[0],
            createdAt: r.createdAt.toISOString(),
        };
    }
    async getReviews(companionId, page = 1, limit = 20) {
        const [reviews, total, avgRating] = await Promise.all([
            this.prisma.companionReview.findMany({
                where: { companionId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.companionReview.count({ where: { companionId } }),
            this.prisma.companionReview.aggregate({
                where: { companionId },
                _avg: { rating: true },
            }),
        ]);
        return {
            reviews: reviews.map(r => this.toReviewResponse(r)),
            total,
            page,
            averageRating: Number((avgRating._avg.rating ?? 0).toFixed(1)),
        };
    }
    async getReview(companionId, reviewId) {
        const review = await this.prisma.companionReview.findFirst({
            where: { id: reviewId, companionId },
        });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        return this.toReviewResponse(review);
    }
    async getTrustScore(companionId) {
        const companion = await this.prisma.companion.findUnique({
            where: { id: companionId },
            select: { trustScore: true, trustLevel: true, totalSessions: true, rating: true, totalReviews: true },
        });
        if (!companion)
            throw new common_1.NotFoundException('Companion not found');
        return {
            trustScore: companion.trustScore,
            trustLevel: companion.trustLevel.toLowerCase(),
            totalSessions: companion.totalSessions,
            rating: Number(companion.rating),
            totalReviews: companion.totalReviews,
            breakdown: {
                identityVerification: 25,
                safetyCompliance: 20,
                sessionHistory: Math.min(25, companion.totalSessions * 2),
                reviewScore: Math.round((Number(companion.rating) / 5) * 20),
                platformEngagement: 10,
            },
        };
    }
    async getTrustTasks(companionId) {
        const tasks = await this.prisma.trustTask.findMany({
            where: { companionId },
            orderBy: [{ isCompleted: 'asc' }, { createdAt: 'asc' }],
        });
        if (!tasks.length)
            return this.getDefaultTasks();
        return tasks.map(t => ({
            taskId: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            points: t.points,
            isCompleted: t.isCompleted,
            completedAt: t.completedAt?.toISOString() ?? null,
        }));
    }
    async getBadges(companionId) {
        const badges = await this.prisma.companionBadge.findMany({
            where: { companionId },
            orderBy: { earnedAt: 'desc' },
        });
        return badges.map(b => ({
            badgeId: b.id,
            badgeKey: b.badgeKey,
            badgeName: b.badgeName,
            earnedAt: b.earnedAt.toISOString(),
        }));
    }
    getDefaultTasks() {
        return [
            { taskId: 'default-1', title: 'Complete Profile', description: 'Fill in all profile sections', category: 'profile', points: 10, isCompleted: false, completedAt: null },
            { taskId: 'default-2', title: 'Upload Profile Photo', description: 'Add a clear profile photo', category: 'profile', points: 15, isCompleted: false, completedAt: null },
            { taskId: 'default-3', title: 'Complete KYC', description: 'Verify your identity documents', category: 'safety', points: 25, isCompleted: false, completedAt: null },
            { taskId: 'default-4', title: 'Add Emergency Contact', description: 'Add at least one trusted contact', category: 'safety', points: 10, isCompleted: false, completedAt: null },
            { taskId: 'default-5', title: 'Complete First Session', description: 'Finish your first companionship session', category: 'sessions', points: 20, isCompleted: false, completedAt: null },
        ];
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map