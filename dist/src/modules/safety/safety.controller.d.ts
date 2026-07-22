import { SafetyService } from './safety.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
declare class SOSTriggerDto {
    sessionId?: string;
    lat?: number;
    lng?: number;
}
declare class SOSResolveDto {
    sosId: string;
}
declare class TimerStartDto {
    durationMinutes: number;
    sessionId?: string;
}
declare class AddContactDto {
    name: string;
    phone: string;
    relationship: string;
    isEmergencyContact?: boolean;
}
declare class UpdateContactDto {
    name?: string;
    phone?: string;
    relationship?: string;
    isEmergencyContact?: boolean;
}
declare class BlockCustomerDto {
    reason?: string;
    otherText?: string;
}
declare class ReportCustomerDto {
    category: string;
    description: string;
    alsoBlock?: boolean;
    sessionId?: string;
}
declare class IncidentDto {
    description: string;
    sessionId?: string;
}
declare class EvidenceDto {
    evidenceUrls: string[];
}
export declare class SafetyController {
    private readonly safetyService;
    constructor(safetyService: SafetyService);
    triggerSOS(c: JwtPayload, dto: SOSTriggerDto): Promise<{
        sosId: string;
        status: string;
        message: string;
        triggeredAt: string;
    }>;
    resolveSOS(c: JwtPayload, dto: SOSResolveDto): Promise<{
        message: string;
    }>;
    startTimer(c: JwtPayload, dto: TimerStartDto): Promise<{
        status: string;
        durationMinutes: number;
        expiresAt: string;
        message: string;
    }>;
    checkinTimer(c: JwtPayload): Promise<{
        status: string;
        nextCheckinAt: string;
        message: string;
    }>;
    cancelTimer(c: JwtPayload): Promise<{
        status: string;
        message: string;
    }>;
    getSettings(c: JwtPayload): Promise<{
        locationTracking: boolean;
        autoCheckIn: boolean;
        disguisedCall: boolean;
    }>;
    updateSettings(c: JwtPayload, dto: any): Promise<{
        locationTracking: boolean;
        autoCheckIn: boolean;
        disguisedCall: boolean;
        message: string;
    }>;
    getTrustedContacts(c: JwtPayload): Promise<{
        contactId: any;
        name: any;
        maskedPhone: any;
        relationship: any;
        isEmergencyContact: any;
    }[]>;
    addContact(c: JwtPayload, dto: AddContactDto): Promise<{
        contactId: any;
        name: any;
        maskedPhone: any;
        relationship: any;
        isEmergencyContact: any;
    }>;
    updateContact(c: JwtPayload, id: string, dto: UpdateContactDto): Promise<{
        contactId: string;
        message: string;
    }>;
    deleteContact(c: JwtPayload, id: string): Promise<{
        message: string;
    }>;
    blockCustomer(c: JwtPayload, cid: string, dto: BlockCustomerDto): Promise<{
        message: string;
    }>;
    reportCustomer(c: JwtPayload, cid: string, dto: ReportCustomerDto): Promise<{
        reportId: string;
        message: string;
    }>;
    reportIncident(c: JwtPayload, dto: IncidentDto): Promise<{
        reportId: string;
        message: string;
        status: string;
    }>;
    uploadEvidence(c: JwtPayload, rid: string, dto: EvidenceDto): Promise<{
        message: string;
    }>;
    completeSafetyQuiz(c: JwtPayload, score: number): Promise<{
        success: boolean;
        message: string;
        badgeEarned: boolean;
    }>;
}
export {};
