import { KycService } from './kyc.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { BasicDetailsDto, SaveDeclarationDto, SubmitGovernmentIdDto, UpdateGovernmentIdTypeDto, SubmitSelfieDto, SaveAddressDto, SavePanDto, SaveBankDto, VerifyBankDto, SaveUpiDto } from './dto/kyc.dto';
export declare class KycController {
    private readonly kycService;
    constructor(kycService: KycService);
    saveBasicDetails(c: JwtPayload, dto: BasicDetailsDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    getStatus(c: JwtPayload): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
    }>;
    saveDraft(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        savedAt: string;
        stage: string;
        message: string;
    }>;
    updateGovernmentIdType(c: JwtPayload, dto: UpdateGovernmentIdTypeDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    submitGovernmentId(c: JwtPayload, dto: SubmitGovernmentIdDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    submitSelfie(c: JwtPayload, dto: SubmitSelfieDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    saveAddress(c: JwtPayload, dto: SaveAddressDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    savePan(c: JwtPayload, dto: SavePanDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    saveBank(c: JwtPayload, dto: SaveBankDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        bankId: string;
        maskedAccount: string;
        bankName: string;
        message: string;
    }>;
    verifyBank(c: JwtPayload, dto: VerifyBankDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        verified: boolean;
        maskedAccount: string;
        bankName: string;
        message: string;
    }>;
    saveUpi(c: JwtPayload, dto: SaveUpiDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    saveEmergencyContact(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    saveDeclaration(c: JwtPayload, dto: SaveDeclarationDto): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
    }>;
    submitKyc(c: JwtPayload): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
        submittedAt: string;
    }>;
    resubmitKyc(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        message: string;
        submittedAt: string;
    }>;
    acceptTerms(c: JwtPayload): Promise<{
        success: boolean;
        message: string;
        termsAccepted: boolean;
        termsAcceptedAt: string;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        nextStep: string;
    }>;
    acceptTermsAlias(c: JwtPayload): Promise<{
        success: boolean;
        message: string;
        termsAccepted: boolean;
        termsAcceptedAt: string;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        nextStep: string;
    }>;
    acceptTermsProfileAlias(c: JwtPayload): Promise<{
        success: boolean;
        message: string;
        termsAccepted: boolean;
        termsAcceptedAt: string;
        onboardingStatus: import("./progress-engine.service").OnboardingStatus;
        nextStep: string;
    }>;
}
