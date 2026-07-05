import { SessionsService } from './sessions.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
declare class VerifyCustomerDto {
    passCode: string;
}
declare class ExtendSessionDto {
    extraMinutes: number;
}
declare class EndEarlyDto {
    reason?: string;
}
declare class CancelSessionDto {
    reason: string;
}
declare class SessionNotesDto {
    notes: string;
}
declare class RateCustomerDto {
    rating: number;
    feedback?: string;
}
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    getUpcoming(c: JwtPayload): Promise<{
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }[]>;
    getHistory(c: JwtPayload, page?: number, limit?: number): Promise<{
        sessions: {
            sessionId: any;
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
            scheduledStart: any;
            scheduledEnd: any;
            durationMinutes: any;
            language: any;
            baseEarning: number;
            bonusEarning: number;
            estimatedTotal: number;
            confirmedEarning: number;
            checkInTime: any;
            checkOutTime: any;
            sessionPassCode: any;
            safetyTimerActive: any;
            notes: any;
            createdAt: any;
        }[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>;
    getSession(c: JwtPayload, sessionId: string): Promise<{
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }>;
    getPass(c: JwtPayload, sessionId: string): Promise<{
        sessionId: string;
        sessionPassCode: string;
        status: string;
        venueName: string;
        venueArea: string;
        venueMeetingPoint: string;
        scheduledStart: string;
        customerInitials: string;
        category: string;
    }>;
    checkIn(c: JwtPayload, sessionId: string): Promise<{
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }>;
    verifyCustomer(c: JwtPayload, sessionId: string, dto: VerifyCustomerDto): Promise<{
        verified: boolean;
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }>;
    requestExtension(c: JwtPayload, sessionId: string, dto: ExtendSessionDto): Promise<{
        sessionId: string;
        extraMinutes: number;
        status: string;
        message: string;
    }>;
    confirmExtension(c: JwtPayload, sessionId: string, dto: ExtendSessionDto): Promise<{
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }>;
    endEarly(c: JwtPayload, sessionId: string, dto: EndEarlyDto): Promise<{
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }>;
    cancelSession(c: JwtPayload, sessionId: string, dto: CancelSessionDto): Promise<{
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }>;
    reportNoShow(c: JwtPayload, sessionId: string): Promise<{
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }>;
    completeSession(c: JwtPayload, sessionId: string): Promise<{
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }>;
    saveNotes(c: JwtPayload, sessionId: string, dto: SessionNotesDto): Promise<{
        sessionId: any;
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
        scheduledStart: any;
        scheduledEnd: any;
        durationMinutes: any;
        language: any;
        baseEarning: number;
        bonusEarning: number;
        estimatedTotal: number;
        confirmedEarning: number;
        checkInTime: any;
        checkOutTime: any;
        sessionPassCode: any;
        safetyTimerActive: any;
        notes: any;
        createdAt: any;
    }>;
    rateCustomer(c: JwtPayload, sessionId: string, dto: RateCustomerDto): Promise<{
        sessionId: string;
        customerRating: number;
        message: string;
    }>;
}
export {};
