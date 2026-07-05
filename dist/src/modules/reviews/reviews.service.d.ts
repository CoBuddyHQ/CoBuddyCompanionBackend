import { PrismaService } from '../../prisma/prisma.service';
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
    private toReviewResponse;
    getReviews(companionId: string, page?: number, limit?: number): Promise<{
        reviews: {
            reviewId: any;
            sessionId: any;
            customerInitials: any;
            rating: any;
            isPublic: any;
            highlights: any;
            comment: any;
            sessionCategory: any;
            sessionDate: any;
            createdAt: any;
        }[];
        total: number;
        page: number;
        averageRating: number;
    }>;
    getReview(companionId: string, reviewId: string): Promise<{
        reviewId: any;
        sessionId: any;
        customerInitials: any;
        rating: any;
        isPublic: any;
        highlights: any;
        comment: any;
        sessionCategory: any;
        sessionDate: any;
        createdAt: any;
    }>;
    getTrustScore(companionId: string): Promise<{
        trustScore: number;
        trustLevel: string;
        totalSessions: number;
        rating: number;
        totalReviews: number;
        breakdown: {
            identityVerification: number;
            safetyCompliance: number;
            sessionHistory: number;
            reviewScore: number;
            platformEngagement: number;
        };
    }>;
    getTrustTasks(companionId: string): Promise<{
        taskId: string;
        title: string;
        description: string;
        category: string;
        points: number;
        isCompleted: boolean;
        completedAt: any;
    }[]>;
    getBadges(companionId: string): Promise<{
        badgeId: string;
        badgeKey: string;
        badgeName: string;
        earnedAt: string;
    }[]>;
    private getDefaultTasks;
}
