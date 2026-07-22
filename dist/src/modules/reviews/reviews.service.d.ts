import { PrismaService } from '../../prisma/prisma.service';
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
    private toReviewResponse;
    getReviews(companionId: string, page?: number, limit?: number): Promise<{
        reviews: {
            id: any;
            customerName: any;
            rating: any;
            date: any;
            comment: any;
            tags: any;
            sessionCategory: any;
            durationMinutes: any;
            replyText: any;
            isReported: any;
        }[];
        total: number;
        page: number;
        averageRating: number;
        ratingBreakdown: {
            5: number;
            4: number;
            3: number;
            2: number;
            1: number;
        };
    }>;
    getReview(companionId: string, reviewId: string): Promise<{
        id: any;
        customerName: any;
        rating: any;
        date: any;
        comment: any;
        tags: any;
        sessionCategory: any;
        durationMinutes: any;
        replyText: any;
        isReported: any;
    }>;
    reportReview(companionId: string, reviewId: string): Promise<{
        success: boolean;
    }>;
    replyToReview(companionId: string, reviewId: string, reply: string): Promise<{
        success: boolean;
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
