import { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Request } from 'express';
declare class CreateOrderDto {
    requestId: string;
    amountINR: number;
    customerPhone: string;
}
declare class VerifyPaymentDto {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}
declare class RefundDto {
    razorpayPaymentId: string;
    amountINR?: number;
    reason?: string;
    sessionId?: string;
}
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    razorpayWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
    createOrder(c: JwtPayload, dto: CreateOrderDto): Promise<{
        orderId: any;
        amount: number;
        currency: string;
        key: string;
    }>;
    verifyPayment(dto: VerifyPaymentDto): Promise<{
        success: boolean;
        paymentId: string;
    }>;
    getStatus(orderId: string): Promise<{
        orderId: string;
        paymentId: string;
        status: string;
        amountINR: number;
        requestId: string;
    }>;
    initiateRefund(dto: RefundDto): Promise<{
        refundId: any;
        status: any;
        amountINR: number;
    }>;
}
export {};
