import { PrismaService } from '../../prisma/prisma.service';
export declare class EarningsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getSummary(companionId: string): Promise<{
        availableBalance: number;
        pendingBalance: number;
        totalEarnedAllTime: number;
        totalEarnedThisMonth: number;
        totalSessionsThisMonth: number;
        nextPayoutCycleDate: string;
        safetyHoldAmount: number;
    }>;
    getTransactions(companionId: string, page?: number, limit?: number): Promise<{
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
    getTransaction(companionId: string, transactionId: string): Promise<{
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
    requestPayout(companionId: string, amount: number, bankMasked: string): Promise<{
        payoutId: string;
        status: string;
        amount: number;
        platformFee: number;
        maskedBank: string;
        message: string;
    }>;
    getPayoutHistory(companionId: string, page?: number, limit?: number): Promise<{
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
    getPayoutDetail(companionId: string, payoutId: string): Promise<{
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
    getInvoices(companionId: string, page?: number, limit?: number): Promise<{
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
    getInvoiceDetail(companionId: string, invoiceId: string): Promise<{
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
    private toTransactionResponse;
    private toPayoutResponse;
}
