import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class PaymentsService {
    private config;
    private prisma;
    private readonly logger;
    private get keyId();
    private get keySecret();
    private get webhookSecret();
    private get razorpayAuth();
    constructor(config: ConfigService, prisma: PrismaService);
    createOrder(params: {
        requestId: string;
        amountINR: number;
        customerPhone: string;
        companionId: string;
        notes?: Record<string, string>;
    }): Promise<{
        orderId: any;
        amount: number;
        currency: string;
        key: string;
    }>;
    verifyPayment(params: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }): Promise<{
        success: boolean;
        paymentId: string;
    }>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<{
        received: boolean;
    }>;
    initiateCompanionPayout(params: {
        companionId: string;
        amountINR: number;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        accountName: string;
        payoutRecordId: string;
    }): Promise<{
        razorpayPayoutId: string;
        status: string;
        utr: string | null;
    }>;
    private getOrCreateFundAccount;
    getPaymentStatus(razorpayOrderId: string): Promise<{
        orderId: string;
        paymentId: string;
        status: string;
        amountINR: number;
        requestId: string;
    }>;
    initiateRefund(params: {
        razorpayPaymentId: string;
        amountINR?: number;
        reason?: string;
        sessionId?: string;
    }): Promise<{
        refundId: any;
        status: any;
        amountINR: number;
    }>;
}
