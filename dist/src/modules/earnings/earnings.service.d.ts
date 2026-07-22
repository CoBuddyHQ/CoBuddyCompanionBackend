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
            id: any;
            title: any;
            date: any;
            amount: number;
            type: "pending" | "credit" | "debit";
            status: any;
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
        id: any;
        title: any;
        date: any;
        amount: number;
        type: "pending" | "credit" | "debit";
        status: any;
        sessionId: any;
        customerInitials: any;
        description: any;
        createdAt: any;
        payoutEligibleAt: any;
    }>;
    requestPayout(companionId: string, amount: number): Promise<{
        payoutId: string;
        status: string;
        amount: number;
        platformFee: number;
        maskedBank: string;
        estimatedArrival: string;
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
    getWeeklyEarnings(companionId: string): Promise<{
        thisWeekEarnings: number;
        lastWeekEarnings: number;
        weeklyGrowthPct: number;
        weeklyBreakdown: {
            day: string;
            amount: number;
            sessions: number;
        }[];
    }>;
    getDailyEarnings(companionId: string, dateStr?: string): Promise<{
        date: string;
        netEarnings: number;
        grossEarnings: number;
        platformFee: number;
        transactions: {
            transactionId: any;
            id: any;
            title: any;
            date: any;
            amount: number;
            type: "pending" | "credit" | "debit";
            status: any;
            sessionId: any;
            customerInitials: any;
            description: any;
            createdAt: any;
            payoutEligibleAt: any;
        }[];
    }>;
    getPendingEarnings(companionId: string): Promise<{
        pendingTotal: number;
        transactions: {
            clearanceAt: string;
            hoursRemaining: number;
            transactionId: any;
            id: any;
            title: any;
            date: any;
            amount: number;
            type: "pending" | "credit" | "debit";
            status: any;
            sessionId: any;
            customerInitials: any;
            description: any;
            createdAt: any;
            payoutEligibleAt: any;
        }[];
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
        baseAmount: number;
        platformFee: number;
        gst: number;
        netPayout: number;
        billedTo: string;
        gstin: string;
        companionCode: string;
        panNumber: string;
        category: string;
        venueName: string;
        durationMinutes: number;
        language: string;
        status: string;
    }>;
    downloadStatement(companionId: string): Promise<{
        companionId: string;
        email: string;
        transactionCount: number;
        totalEarned: number;
        generatedAt: string;
        message: string;
    }>;
    private toTransactionResponse;
    private toPayoutResponse;
}
