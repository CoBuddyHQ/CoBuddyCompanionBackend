import { PrismaService } from '../../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardData(companionId: string): Promise<any>;
    private ensureDemoData;
    getPerformanceInsights(companionId: string, period?: 'week' | 'month'): Promise<{
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
    private toSessionPreview;
    private toRequestPreview;
}
