import { EarningsService } from './earnings.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
declare class PayoutRequestDto {
    amount: number;
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
    getTransaction(c: JwtPayload, id: string): Promise<{
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
        estimatedArrival: string;
        message: string;
    }>;
    getWeeklyEarnings(c: JwtPayload): Promise<{
        thisWeekEarnings: number;
        lastWeekEarnings: number;
        weeklyGrowthPct: number;
        weeklyBreakdown: {
            day: string;
            amount: number;
            sessions: number;
        }[];
    }>;
    getDailyEarnings(c: JwtPayload): Promise<{
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
    getPendingEarnings(c: JwtPayload): Promise<{
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
}
export {};
