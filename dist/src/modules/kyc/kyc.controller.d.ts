import { KycService } from './kyc.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class KycController {
    private readonly kycService;
    constructor(kycService: KycService);
    getStatus(c: JwtPayload): Promise<{
        kycId: string;
        overallStatus: string;
        identityDocumentType: string;
        identityDocumentStatus: string;
        selfieStatus: string;
        addressDocumentStatus: string;
        policeVerificationStatus: string;
        rejectionReason: string;
        submittedAt: string;
        approvedAt: string;
    }>;
    uploadIdentity(c: JwtPayload, dto: any): Promise<{
        message: string;
    }>;
    uploadSelfie(c: JwtPayload, dto: any): Promise<{
        message: string;
    }>;
    uploadAddress(c: JwtPayload, dto: any): Promise<{
        message: string;
    }>;
    uploadPolice(c: JwtPayload, dto: any): Promise<{
        message: string;
    }>;
}
