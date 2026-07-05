import { PrismaService } from '../../prisma/prisma.service';
export declare class SafetyService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    triggerSOS(companionId: string, sessionId?: string, lat?: number, lng?: number): Promise<{
        sosId: string;
        status: string;
        message: string;
        triggeredAt: string;
    }>;
    resolveSOS(companionId: string, sosId: string): Promise<{
        message: string;
    }>;
    startTimer(companionId: string, durationMinutes: number, sessionId?: string): Promise<{
        status: string;
        durationMinutes: number;
        expiresAt: string;
        message: string;
    }>;
    checkinTimer(companionId: string): Promise<{
        status: string;
        nextCheckinAt: string;
        message: string;
    }>;
    cancelTimer(companionId: string): Promise<{
        status: string;
        message: string;
    }>;
    getTrustedContacts(companionId: string): Promise<{
        contactId: any;
        name: any;
        maskedPhone: any;
        relationship: any;
        isEmergencyContact: any;
    }[]>;
    addTrustedContact(companionId: string, dto: any): Promise<{
        contactId: any;
        name: any;
        maskedPhone: any;
        relationship: any;
        isEmergencyContact: any;
    }>;
    updateTrustedContact(companionId: string, contactId: string, dto: any): Promise<{
        contactId: string;
        message: string;
    }>;
    deleteTrustedContact(companionId: string, contactId: string): Promise<{
        message: string;
    }>;
    blockCustomer(companionId: string, customerId: string, reason?: string): Promise<{
        message: string;
    }>;
    reportCustomer(companionId: string, customerId: string, reason: string, sessionId?: string): Promise<{
        message: string;
    }>;
    reportIncident(companionId: string, description: string, sessionId?: string): Promise<{
        reportId: string;
        message: string;
        status: string;
    }>;
    uploadEvidence(companionId: string, reportId: string, evidenceUrls: string[]): Promise<{
        message: string;
    }>;
    private toContactResponse;
    private maskPhone;
}
