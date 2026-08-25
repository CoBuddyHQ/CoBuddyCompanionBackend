import { PrismaService } from '../../prisma/prisma.service';
import { ProgressEngineService } from './progress-engine.service';
import { BasicDetailsDto, SaveDeclarationDto, SubmitGovernmentIdDto, UpdateGovernmentIdTypeDto, SubmitSelfieDto, SaveAddressDto, SavePanDto, SaveBankDto, VerifyBankDto, SaveUpiDto } from './dto/kyc.dto';
export declare class KycService {
    private prisma;
    private progressEngine;
    constructor(prisma: PrismaService, progressEngine: ProgressEngineService);
    getKycStatus(companionId: string): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
    }>;
    private logCompletion;
    saveBasicDetails(companionId: string, dto: BasicDetailsDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    saveDraft(companionId: string, dto: {
        stage: string;
        data?: any;
    }): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        savedAt: string;
        stage: string;
        message: string;
    }>;
    updateGovernmentIdType(companionId: string, dto: UpdateGovernmentIdTypeDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    submitGovernmentId(companionId: string, dto: SubmitGovernmentIdDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    submitSelfie(companionId: string, dto: SubmitSelfieDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    saveAddress(companionId: string, dto: SaveAddressDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    saveUpi(companionId: string, dto: SaveUpiDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    savePan(companionId: string, dto: SavePanDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    saveBank(companionId: string, dto: SaveBankDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        bankId: string;
        maskedAccount: string;
        bankName: string;
        message: string;
    }>;
    verifyBank(companionId: string, dto: VerifyBankDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
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
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    saveDeclaration(companionId: string, dto: SaveDeclarationDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    submitKyc(companionId: string): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
        submittedAt: string;
    }>;
    resubmitKyc(companionId: string, dto: {
        updatedDocuments: string[];
    }): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
        submittedAt: string;
    }>;
    acceptTerms(companionId: string): Promise<{
        success: boolean;
        message: string;
        termsAccepted: boolean;
        termsAcceptedAt: string;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        nextStep: string;
    }>;
}
