import { EarningsService } from './earnings.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
declare class PayoutRequestDto {
    amount: number;
    bankMasked: string;
}
export declare class EarningsController {
    private readonly earningsService;
    constructor(earningsService: EarningsService);
    getSummary(c: JwtPayload): Promise<{
        availableBalance: number;
        pendingBalance: number;
        totalEarnedAllTime: number;
        totalEarnedThisMonth: number;
        totalSessionsThisMonth: number;
        nextPayoutCycleDate: string;
        safetyHoldAmount: number;
    }>;
    getTransactions(c: JwtPayload, page?: number, limit?: number): Promise<{
        transactions: {
            transactionId: any;
            type: any;
            status: any;
            amount: number;
            sessionId: any;
            customerInitials: any;
            description: any;
            createdAt: any;
            payoutEligibleAt: any;
        }[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>;
    getTransaction(c: JwtPayload, id: string): Promise<{
        transactionId: any;
        type: any;
        status: any;
        amount: number;
        sessionId: any;
        customerInitials: any;
        description: any;
        createdAt: any;
        payoutEligibleAt: any;
    }>;
    getPayoutHistory(c: JwtPayload, page?: number): Promise<{
        payouts: {
            payoutId: any;
            status: any;
            amount: number;
            platformFee: number;
            maskedBank: any;
            utrNumber: any;
            requestedAt: any;
            completedAt: any;
            failureReason: any;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    requestPayout(c: JwtPayload, dto: PayoutRequestDto): Promise<{
        payoutId: string;
        status: string;
        amount: number;
        platformFee: number;
        maskedBank: string;
        message: string;
    }>;
    getPayoutDetail(c: JwtPayload, payoutId: string): Promise<{
        payoutId: any;
        status: any;
        amount: number;
        platformFee: number;
        maskedBank: any;
        utrNumber: any;
        requestedAt: any;
        completedAt: any;
        failureReason: any;
    }>;
    getInvoices(c: JwtPayload, page?: number): Promise<{
        invoices: {
            invoiceId: string;
            sessionId: string;
            date: string;
            amount: number;
            category: string;
            venueName: string;
            durationMinutes: number;
            status: string;
        }[];
    }>;
    getInvoiceDetail(c: JwtPayload, invoiceId: string): Promise<{
        invoiceId: string;
        sessionId: string;
        date: string;
        amount: number;
        breakdown: {
            baseEarning: number;
            bonusEarning: number;
            platformFee: number;
        };
        category: string;
        venueName: string;
        durationMinutes: number;
        language: string;
        status: string;
    }>;
}
export {};
