import { SettingsService } from './settings.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { OnboardingSyncDto } from './dto/settings.dto';
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
