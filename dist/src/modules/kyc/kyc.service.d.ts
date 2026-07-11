import { PrismaService } from '../../prisma/prisma.service';
import { BasicDetailsDto } from './dto/kyc.dto';
export declare class KycService {
    private prisma;
    constructor(prisma: PrismaService);
    getKycStatus(companionId: string): Promise<{
        kycId: string;
        overallStatus: string;
        profileStatus: string;
        steps: {
            identity: {
                status: string;
                documentType: string;
                submittedAt: string;
            };
            selfie: {
                status: string;
                submittedAt: string;
            };
            address: {
                status: string;
                documentType: string;
                submittedAt: string;
            };
            pan: {
                status: string;
                maskedPan: string;
            };
            bank: {
                status: string;
                maskedAccount: string;
                bankName: string;
            };
            upi: {
                status: string;
                maskedUpi: string;
            };
            emergencyContact: {
                status: string;
                name: string;
            };
            declaration: {
                status: string;
                agreedAt: string;
            };
        };
        rejectionReason: string;
        submittedAt: string;
        approvedAt: string;
    }>;
    saveBasicDetails(companionId: string, dto: BasicDetailsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    saveDraft(companionId: string, dto: {
        stage: string;
        data?: any;
    }): Promise<{
        success: boolean;
        savedAt: string;
        stage: string;
        message: string;
    }>;
    submitGovernmentId(companionId: string, dto: {
        documentType: string;
        frontUrl: string;
        backUrl?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    submitSelfie(companionId: string, dto: {
        videoUrl: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    submitAddress(companionId: string, dto: {
        documentType: string;
        documentUrl: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    savePan(companionId: string, dto: {
        maskedPan: string;
        panName: string;
        hasGST: boolean;
        gstNumber?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    saveBank(companionId: string, dto: {
        holderName: string;
        maskedAccount: string;
        ifsc: string;
        accountType: string;
        bankName: string;
    }): Promise<{
        success: boolean;
        bankId: string;
        maskedAccount: string;
        bankName: string;
        message: string;
    }>;
    verifyBank(companionId: string, dto: {
        bankId: string;
    }): Promise<{
        success: boolean;
        verified: boolean;
        maskedAccount: string;
        bankName: string;
        message: string;
    }>;
    saveUpi(companionId: string, dto: {
        maskedUpi: string;
        payoutLabel: string;
        isPrimary: boolean;
    }): Promise<{
        success: boolean;
        maskedUpi: string;
        message: string;
    }>;
    saveEmergencyContact(companionId: string, dto: {
        name: string;
        maskedPhone: string;
        relationship: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    saveDeclaration(companionId: string, dto: {
        agreedAt: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    submitKyc(companionId: string): Promise<{
        success: boolean;
        message: string;
        submittedAt: string;
    }>;
    resubmitKyc(companionId: string, dto: {
        updatedDocuments: string[];
    }): Promise<{
        success: boolean;
        message: string;
        submittedAt: string;
    }>;
}
