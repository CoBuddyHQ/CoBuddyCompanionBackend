import { KycService } from './kyc.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { BasicDetailsDto } from './dto/kyc.dto';
export declare class KycController {
    private readonly kycService;
    constructor(kycService: KycService);
    saveBasicDetails(c: JwtPayload, dto: BasicDetailsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getStatus(c: JwtPayload): Promise<{
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
    saveDraft(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        savedAt: string;
        stage: string;
        message: string;
    }>;
    submitGovernmentId(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    submitSelfie(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    submitAddress(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    savePan(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    saveBank(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        bankId: string;
        maskedAccount: string;
        bankName: string;
        message: string;
    }>;
    verifyBank(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        verified: boolean;
        maskedAccount: string;
        bankName: string;
        message: string;
    }>;
    saveUpi(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        maskedUpi: string;
        message: string;
    }>;
    saveEmergencyContact(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    saveDeclaration(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    submitKyc(c: JwtPayload): Promise<{
        success: boolean;
        message: string;
        submittedAt: string;
    }>;
    resubmitKyc(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        message: string;
        submittedAt: string;
    }>;
}
