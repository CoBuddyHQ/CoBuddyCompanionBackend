import { AccountService } from './account.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class AccountController {
    private readonly accountService;
    constructor(accountService: AccountService);
    getSettings(c: JwtPayload): Promise<{
        companionId: string;
        pushNotifications: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        language: string;
        currency: string;
    }>;
    updateSettings(c: JwtPayload, dto: any): Promise<any>;
    deleteAccount(c: JwtPayload, dto: any): Promise<{
        message: string;
    }>;
}
