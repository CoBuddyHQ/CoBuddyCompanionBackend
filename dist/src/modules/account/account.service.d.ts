import { PrismaService } from '../../prisma/prisma.service';
export declare class AccountService {
    private prisma;
    constructor(prisma: PrismaService);
    private getOrCreateSettings;
    getAccountSettings(companionId: string): Promise<{
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
    updateNotificationPrefs(companionId: string, prefs: any): Promise<{
        success: boolean;
        prefs: import("@prisma/client/runtime/client").JsonValue;
        message: string;
    }>;
    updatePrivacy(companionId: string, dto: {
        visibility: string;
        dataSharing: boolean;
    }): Promise<{
        success: boolean;
        visibility: string;
        dataSharing: boolean;
    }>;
    updateLanguage(companionId: string, dto: {
        language: string;
    }): Promise<{
        success: boolean;
        language: string;
    }>;
    deactivateAccount(companionId: string, dto: {
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    reactivateAccount(companionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAccount(companionId: string, dto: {
        reason?: string;
        confirmation: boolean;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    exportData(companionId: string): Promise<{
        success: boolean;
        downloadLink: string;
        expiresIn: string;
        message: string;
    }>;
}
