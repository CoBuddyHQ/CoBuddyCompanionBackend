import { DashboardService } from './dashboard.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardData(c: JwtPayload): Promise<any>;
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
