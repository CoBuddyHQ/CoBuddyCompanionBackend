import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
export declare class RequestsService {
    private prisma;
    private notificationsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsGateway: NotificationsGateway);
    private toRequestResponse;
    getRequests(companionId: string, status?: string, categories?: string, minEarning?: number, sortBy?: string, page?: number, limit?: number): Promise<{
        requests: {
            requestId: any;
            status: any;
            category: any;
            customer: {
                customerId: any;
                displayInitials: any;
                trustScore: any;
                isVerified: any;
                totalSessionsWithCompanion: any;
                sessionCountOverall: any;
                safetyConsent: any;
                identityVerified: any;
            };
            venue: {
                venueId: any;
                name: any;
                area: any;
                city: any;
                isApproved: any;
                venueType: any;
                meetingPoint: any;
                landmark: any;
            };
            proposedStart: any;
            proposedEnd: any;
            durationMinutes: any;
            language: any;
            estimatedEarning: number;
            matchScore: any;
            expiresAt: any;
            customerNote: any;
            receivedAt: any;
        }[];
        total: number;
        unreadCount: number;
        page: number;
        limit: number;
    }>;
    getRequest(companionId: string, requestId: string): Promise<{
        requestId: any;
        status: any;
        category: any;
        customer: {
            customerId: any;
            displayInitials: any;
            trustScore: any;
            isVerified: any;
            totalSessionsWithCompanion: any;
            sessionCountOverall: any;
            safetyConsent: any;
            identityVerified: any;
        };
        venue: {
            venueId: any;
            name: any;
            area: any;
            city: any;
            isApproved: any;
            venueType: any;
            meetingPoint: any;
            landmark: any;
        };
        proposedStart: any;
        proposedEnd: any;
        durationMinutes: any;
        language: any;
        estimatedEarning: number;
        matchScore: any;
        expiresAt: any;
        customerNote: any;
        receivedAt: any;
    }>;
    getCustomerTrust(companionId: string, requestId: string): Promise<{
        customerId: string;
        displayInitials: string;
        trustScore: number;
        isVerified: boolean;
        identityVerified: boolean;
        safetyConsent: boolean;
        sessionCountOverall: number;
        trustBreakdown: {
            identityScore: number;
            safetyScore: number;
            historyScore: number;
        };
        riskLevel: string;
    }>;
    acceptRequest(companionId: string, requestId: string): Promise<{
        request: {
            requestId: any;
            status: any;
            category: any;
            customer: {
                customerId: any;
                displayInitials: any;
                trustScore: any;
                isVerified: any;
                totalSessionsWithCompanion: any;
                sessionCountOverall: any;
                safetyConsent: any;
                identityVerified: any;
            };
            venue: {
                venueId: any;
                name: any;
                area: any;
                city: any;
                isApproved: any;
                venueType: any;
                meetingPoint: any;
                landmark: any;
            };
            proposedStart: any;
            proposedEnd: any;
            durationMinutes: any;
            language: any;
            estimatedEarning: number;
            matchScore: any;
            expiresAt: any;
            customerNote: any;
            receivedAt: any;
        };
        session: {
            sessionId: string;
            sessionPassCode: string;
        };
        message: string;
    }>;
    declineRequest(companionId: string, requestId: string, reason: string): Promise<{
        request: {
            requestId: any;
            status: any;
            category: any;
            customer: {
                customerId: any;
                displayInitials: any;
                trustScore: any;
                isVerified: any;
                totalSessionsWithCompanion: any;
                sessionCountOverall: any;
                safetyConsent: any;
                identityVerified: any;
            };
            venue: {
                venueId: any;
                name: any;
                area: any;
                city: any;
                isApproved: any;
                venueType: any;
                meetingPoint: any;
                landmark: any;
            };
            proposedStart: any;
            proposedEnd: any;
            durationMinutes: any;
            language: any;
            estimatedEarning: number;
            matchScore: any;
            expiresAt: any;
            customerNote: any;
            receivedAt: any;
        };
        message: string;
    }>;
    counterPropose(companionId: string, requestId: string, newStart: string, newEnd: string): Promise<{
        request: {
            requestId: any;
            status: any;
            category: any;
            customer: {
                customerId: any;
                displayInitials: any;
                trustScore: any;
                isVerified: any;
                totalSessionsWithCompanion: any;
                sessionCountOverall: any;
                safetyConsent: any;
                identityVerified: any;
            };
            venue: {
                venueId: any;
                name: any;
                area: any;
                city: any;
                isApproved: any;
                venueType: any;
                meetingPoint: any;
                landmark: any;
            };
            proposedStart: any;
            proposedEnd: any;
            durationMinutes: any;
            language: any;
            estimatedEarning: number;
            matchScore: any;
            expiresAt: any;
            customerNote: any;
            receivedAt: any;
        };
        message: string;
    }>;
    private findPendingOrThrow;
    private generatePassCode;
}
