import { AccountService } from './account.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class AccountController {
    private readonly accountService;
    constructor(accountService: AccountService);
    getSettings(c: JwtPayload): Promise<{
        companionId: string;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        profileStatus: import(".prisma/client").$Enums.ProfileStatus;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        phone: string;
        settings: {
            notificationPrefs: import("@prisma/client/runtime/client").JsonValue;
            privacyVisibility: string;
            privacyDataSharing: boolean;
            language: string;
        };
        payoutDetails: {
            bankName: string;
            maskedBankAccount: string;
            maskedUpi: string;
        };
    }>;
    updateNotificationPrefs(c: JwtPayload, dto: any): Promise<{
        success: boolean;
        prefs: import("@prisma/client/runtime/client").JsonValue;
        message: string;
    }>;
    updatePrivacy(c: JwtPayload, dto: {
        visibility: string;
        dataSharing: boolean;
    }): Promise<{
        success: boolean;
        visibility: string;
        dataSharing: boolean;
    }>;
    updateLanguage(c: JwtPayload, dto: {
        language: string;
    }): Promise<{
        success: boolean;
        language: string;
    }>;
    deactivateAccount(c: JwtPayload, dto: {
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    reactivateAccount(c: JwtPayload): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAccount(c: JwtPayload, dto: {
        reason?: string;
        confirmation: boolean;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    exportData(c: JwtPayload): Promise<{
        success: boolean;
        downloadLink: string;
        expiresIn: string;
        message: string;
    }>;
}
