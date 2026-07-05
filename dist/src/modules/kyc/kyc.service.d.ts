import { PrismaService } from '../../prisma/prisma.service';
export declare class KycService {
    private prisma;
    constructor(prisma: PrismaService);
    getKycStatus(companionId: string): Promise<{
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
    uploadIdentity(companionId: string, dto: any): Promise<{
        message: string;
    }>;
    uploadSelfie(companionId: string, dto: any): Promise<{
        message: string;
    }>;
    uploadAddress(companionId: string, dto: any): Promise<{
        message: string;
    }>;
    uploadPolice(companionId: string, dto: any): Promise<{
        message: string;
    }>;
    private getDocStatus;
}
