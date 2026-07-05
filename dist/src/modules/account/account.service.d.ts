import { PrismaService } from '../../prisma/prisma.service';
export declare class AccountService {
    private prisma;
    constructor(prisma: PrismaService);
    getAccountSettings(companionId: string): Promise<{
        companionId: string;
        pushNotifications: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        language: string;
        currency: string;
    }>;
    updateAccountSettings(companionId: string, settings: any): Promise<any>;
    deleteAccount(companionId: string, reason?: string): Promise<{
        message: string;
    }>;
}
