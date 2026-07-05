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
            unreadNotificationsCount: number;
            pendingRequestsCount: number;
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
}
