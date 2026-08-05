import { DashboardService } from './dashboard.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardData(c: JwtPayload): Promise<{
        companion: {
            companionId: string;
            displayName: string;
            profileStatus: string;
            verificationStatus: string;
            isAvailable: boolean;
            trustScore: number;
            trustLevel: string;
            photoUrl: string;
        };
        stats: {
            totalEarnedThisMonth: number;
            todayEarnings: number;
            pendingEarnings: number;
            thisWeekEarnings: number;
            unreadNotificationsCount: number;
            pendingRequestsCount: number;
            upcomingSessionsCount: number;
        };
        activeSession: {
            sessionId: any;
            status: any;
            category: any;
            customerInitials: any;
            scheduledStart: any;
            venueName: any;
        };
        upcomingSessions: {
            sessionId: any;
            status: any;
            category: any;
            customerInitials: any;
            scheduledStart: any;
            venueName: any;
        }[];
        recentRequests: {
            requestId: any;
            category: any;
            customerInitials: any;
            proposedStart: any;
            estimatedEarning: number;
            venueArea: any;
        }[];
    }>;
    getPerformanceInsights(c: JwtPayload): Promise<{
        period: "week" | "month";
        views: number;
        delta: number;
        conversionRate: string;
        avgResponseTime: string;
        profileClickThrough: string;
        totalSessions: number;
        totalReviews: number;
        rating: number;
    }>;
    getAnnouncements(): Promise<{
        announcements: {
            id: string;
            icon: string;
            iconColor: string;
            iconBg: string;
            tag: string;
            tagColor: string;
            title: string;
            body: string;
            date: string;
            url: string;
        }[];
    }>;
}
