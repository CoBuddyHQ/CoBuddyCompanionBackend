import { RequestsService } from './requests.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
declare class DeclineRequestDto {
    reason: string;
}
declare class CounterProposeDto {
    newStart: string;
    newEnd: string;
}
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    getRequests(c: JwtPayload, status?: string, categories?: string, minEarning?: string, sortBy?: string, page?: number, limit?: number): Promise<{
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
    getRequest(c: JwtPayload, requestId: string): Promise<{
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
    getCustomerTrust(c: JwtPayload, requestId: string): Promise<{
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
    acceptRequest(c: JwtPayload, requestId: string): Promise<{
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
    declineRequest(c: JwtPayload, requestId: string, dto: DeclineRequestDto): Promise<{
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
    counterPropose(c: JwtPayload, requestId: string, dto: CounterProposeDto): Promise<{
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
}
export {};
