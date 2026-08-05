import { PrismaService } from '../../prisma/prisma.service';
import { BasicDetailsDto, SaveDeclarationDto, SubmitGovernmentIdDto, UpdateGovernmentIdTypeDto, SubmitSelfieDto, SaveAddressDto, SavePanDto, SaveBankDto, VerifyBankDto, SaveUpiDto } from './dto/kyc.dto';
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
    private logCompletion;
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
    updateGovernmentIdType(companionId: string, dto: UpdateGovernmentIdTypeDto): Promise<{
        success: boolean;
        message: string;
    }>;
    submitGovernmentId(companionId: string, dto: SubmitGovernmentIdDto): Promise<{
        success: boolean;
        message: string;
    }>;
    submitSelfie(companionId: string, dto: SubmitSelfieDto): Promise<{
        success: boolean;
        message: string;
    }>;
    saveAddress(companionId: string, dto: SaveAddressDto): Promise<{
        success: boolean;
        message: string;
    }>;
    saveUpi(companionId: string, dto: SaveUpiDto): Promise<{
        success: boolean;
        message: string;
    }>;
    savePan(companionId: string, dto: SavePanDto): Promise<{
        success: boolean;
        message: string;
    }>;
    saveBank(companionId: string, dto: SaveBankDto): Promise<{
        success: boolean;
        bankId: string;
        maskedAccount: string;
        bankName: string;
        message: string;
    }>;
    verifyBank(companionId: string, dto: VerifyBankDto): Promise<{
        success: boolean;
        verified: boolean;
        maskedAccount: string;
        bankName: string;
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
    saveDeclaration(companionId: string, dto: SaveDeclarationDto): Promise<{
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
