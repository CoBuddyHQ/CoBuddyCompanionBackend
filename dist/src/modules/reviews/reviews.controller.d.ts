import { ReviewsService } from './reviews.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    getReviews(c: JwtPayload, page?: number): Promise<{
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
    getReview(c: JwtPayload, id: string): Promise<{
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
    reportReview(c: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
    replyToReview(c: JwtPayload, id: string, reply: string): Promise<{
        success: boolean;
    }>;
    getTrustScore(c: JwtPayload): Promise<{
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
    getTrustTasks(c: JwtPayload): Promise<{
        taskId: string;
        title: string;
        description: string;
        category: string;
        points: number;
        isCompleted: boolean;
        completedAt: any;
    }[]>;
    getBadges(c: JwtPayload): Promise<{
        badgeId: string;
        badgeKey: string;
        badgeName: string;
        earnedAt: string;
    }[]>;
}
