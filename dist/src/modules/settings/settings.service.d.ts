import { PrismaService } from '../../prisma/prisma.service';
import { OnboardingSyncDto } from './dto/settings.dto';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getBankDetails(companionId: string): Promise<{}>;
    updateBankDetails(companionId: string, dto: {
        holderName: string;
        accountNo: string;
        ifscCode: string;
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
            termsAccepted: boolean;
            createdAt: Date;
            updatedAt: Date;
            companionId: string;
            language: string;
            notificationPrefs: import("@prisma/client/runtime/client").JsonValue;
            showAge: boolean;
            allowPromo: boolean;
            showInSearch: boolean;
            safetyRulesAccepted: boolean;
            locationEnabled: boolean;
            notificationsEnabled: boolean;
            locationTracking: boolean;
            autoCheckIn: boolean;
            disguisedCall: boolean;
        };
    }>;
    getPrivacyControls(companionId: string): Promise<{
        showAge: boolean;
        allowPromo: boolean;
        showInSearch: boolean;
    }>;
    updatePrivacyControls(companionId: string, dto: any): Promise<{
        success: boolean;
        settings: {
            id: string;
            termsAccepted: boolean;
            createdAt: Date;
            updatedAt: Date;
            companionId: string;
            language: string;
            notificationPrefs: import("@prisma/client/runtime/client").JsonValue;
            showAge: boolean;
            allowPromo: boolean;
            showInSearch: boolean;
            safetyRulesAccepted: boolean;
            locationEnabled: boolean;
            notificationsEnabled: boolean;
            locationTracking: boolean;
            autoCheckIn: boolean;
            disguisedCall: boolean;
        };
    }>;
    getNotificationPrefs(companionId: string): Promise<string | number | true | import("@prisma/client/runtime/client").JsonObject | import("@prisma/client/runtime/client").JsonArray>;
    updateNotificationPrefs(companionId: string, dto: any): Promise<{
        success: boolean;
        settings: {
            id: string;
            termsAccepted: boolean;
            createdAt: Date;
            updatedAt: Date;
            companionId: string;
            language: string;
            notificationPrefs: import("@prisma/client/runtime/client").JsonValue;
            showAge: boolean;
            allowPromo: boolean;
            showInSearch: boolean;
            safetyRulesAccepted: boolean;
            locationEnabled: boolean;
            notificationsEnabled: boolean;
            locationTracking: boolean;
            autoCheckIn: boolean;
            disguisedCall: boolean;
        };
    }>;
    requestDataExport(companionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAccount(companionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
