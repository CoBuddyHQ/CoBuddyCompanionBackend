import { SettingsService } from './settings.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { OnboardingSyncDto, UpdatePrivacyDto, UpdateNotificationPrefsDto } from './dto/settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getBankDetails(c: JwtPayload): Promise<{}>;
    updateBankDetails(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    changePin(c: JwtPayload, dto: {
        currentPin: string;
        newPin: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    onboardingSync(c: JwtPayload, dto: OnboardingSyncDto): Promise<{
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
    getPrivacyControls(c: JwtPayload): Promise<{
        showAge: boolean;
        allowPromo: boolean;
        showInSearch: boolean;
    }>;
    updatePrivacyControls(c: JwtPayload, dto: UpdatePrivacyDto): Promise<{
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
    getNotificationPrefs(c: JwtPayload): Promise<string | number | true | import("@prisma/client/runtime/client").JsonObject | import("@prisma/client/runtime/client").JsonArray>;
    updateNotificationPrefs(c: JwtPayload, dto: UpdateNotificationPrefsDto): Promise<{
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
    requestDataExport(c: JwtPayload): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAccount(c: JwtPayload): Promise<{
        success: boolean;
        message: string;
    }>;
}
