import { PrismaService } from '../../prisma/prisma.service';
import { OnboardingSyncDto } from './dto/settings.dto';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getBankDetails(companionId: string): Promise<{}>;
    updateBankDetails(companionId: string, dto: {
        holderName: string;
        accountNo: string;
        ifsc: string;
        bankName: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    changePin(companionId: string, dto: {
        currentPin: string;
        newPin: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    onboardingSync(companionId: string, dto: OnboardingSyncDto): Promise<{
        success: boolean;
        settings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companionId: string;
            notificationPrefs: import("@prisma/client/runtime/client").JsonValue;
            privacyVisibility: string;
            privacyDataSharing: boolean;
            language: string;
            termsAccepted: boolean;
            safetyRulesAccepted: boolean;
            locationEnabled: boolean;
            notificationsEnabled: boolean;
        };
    }>;
}
