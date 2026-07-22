"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../../prisma/prisma.service");
const RAZORPAY_BASE = 'https://api.razorpay.com/v1';
let PaymentsService = PaymentsService_1 = class PaymentsService {
    get keyId() { return this.config.get('RAZORPAY_KEY_ID', ''); }
    get keySecret() { return this.config.get('RAZORPAY_KEY_SECRET', ''); }
    get webhookSecret() { return this.config.get('RAZORPAY_WEBHOOK_SECRET', ''); }
    get razorpayAuth() {
        const cred = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        return { Authorization: `Basic ${cred}` };
    }
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    async createOrder(params) {
        const amountPaisa = Math.round(params.amountINR * 100);
        try {
            const { data } = await axios_1.default.post(`${RAZORPAY_BASE}/orders`, {
                amount: amountPaisa,
                currency: 'INR',
                receipt: `REQ-${params.requestId.slice(-8)}`,
                notes: {
                    requestId: params.requestId,
                    companionId: params.companionId,
                    ...(params.notes ?? {}),
                },
            }, { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } });
            this.logger.log(`Razorpay order created: ${data.id} for ₹${params.amountINR}`);
            await this.prisma.razorpayOrder.create({
                data: {
                    razorpayOrderId: data.id,
                    requestId: params.requestId,
                    companionId: params.companionId,
                    amountPaisa,
                    status: 'created',
                },
            });
            return {
                orderId: data.id,
                amount: amountPaisa,
                currency: 'INR',
                key: this.keyId,
            };
        }
        catch (err) {
            this.logger.error('Razorpay createOrder failed', err?.response?.data ?? err.message);
            throw new common_1.InternalServerErrorException('Payment order creation failed');
        }
    }
    async verifyPayment(params) {
        const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
        const expected = (0, crypto_1.createHmac)('sha256', this.keySecret)
            .update(body)
            .digest('hex');
        if (expected !== params.razorpaySignature) {
            this.logger.warn(`Payment signature mismatch for order ${params.razorpayOrderId}`);
            throw new common_1.BadRequestException('Invalid payment signature');
        }
        const order = await this.prisma.razorpayOrder.update({
            where: { razorpayOrderId: params.razorpayOrderId },
            data: { status: 'paid', razorpayPaymentId: params.razorpayPaymentId },
        });
        if (order.requestId) {
            await this.prisma.bookingRequest.update({
                where: { id: order.requestId },
                data: { paymentStatus: 'paid', status: 'pending' },
            });
        }
        this.logger.log(`Payment verified ✓ order=${params.razorpayOrderId} payment=${params.razorpayPaymentId}`);
        return { success: true, paymentId: params.razorpayPaymentId };
    }
    async handleWebhook(rawBody, signature) {
        const expected = (0, crypto_1.createHmac)('sha256', this.webhookSecret)
            .update(rawBody)
            .digest('hex');
        if (expected !== signature) {
            this.logger.warn('Webhook signature invalid — rejecting');
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        const event = JSON.parse(rawBody.toString());
        this.logger.log(`Razorpay webhook: ${event.event}`);
        switch (event.event) {
            case 'payment.captured': {
                const payment = event.payload.payment.entity;
                const orderId = payment.order_id;
                const order = await this.prisma.razorpayOrder.findUnique({ where: { razorpayOrderId: orderId } });
                if (order?.requestId) {
                    await this.prisma.bookingRequest.update({
                        where: { id: order.requestId },
                        data: { paymentStatus: 'paid', status: 'pending' },
                    });
                    await this.prisma.razorpayOrder.update({
                        where: { razorpayOrderId: orderId },
                        data: { status: 'paid', razorpayPaymentId: payment.id },
                    });
                    this.logger.log(`Booking ${order.requestId} confirmed after payment capture`);
                }
                break;
            }
            case 'payment.failed': {
                const payment = event.payload.payment.entity;
                const orderId = payment.order_id;
                const order = await this.prisma.razorpayOrder.findUnique({ where: { razorpayOrderId: orderId } });
                if (order?.requestId) {
                    await this.prisma.bookingRequest.update({
                        where: { id: order.requestId },
                        data: { paymentStatus: 'failed' },
                    });
                    await this.prisma.razorpayOrder.update({
                        where: { razorpayOrderId: orderId },
                        data: { status: 'failed' },
                    });
                    this.logger.warn(`Payment failed for booking ${order.requestId}`);
                }
                break;
            }
            case 'payout.processed': {
                const payout = event.payload.payout.entity;
                await this.prisma.payoutRecord.updateMany({
                    where: { razorpayPayoutId: payout.id },
                    data: { status: 'completed', utrNumber: payout.utr, completedAt: new Date() },
                });
                this.logger.log(`Payout ${payout.id} processed. UTR: ${payout.utr}`);
                break;
            }
            case 'payout.failed': {
                const payout = event.payload.payout.entity;
                await this.prisma.payoutRecord.updateMany({
                    where: { razorpayPayoutId: payout.id },
                    data: { status: 'failed', failureReason: payout.failure_reason },
                });
                this.logger.warn(`Payout ${payout.id} failed: ${payout.failure_reason}`);
                break;
            }
            case 'refund.processed': {
                const refund = event.payload.refund.entity;
                this.logger.log(`Refund processed: ${refund.id} — ₹${refund.amount / 100}`);
                break;
            }
            default:
                this.logger.log(`Unhandled Razorpay event: ${event.event}`);
        }
        return { received: true };
    }
    async initiateCompanionPayout(params) {
        try {
            const fundAccountId = await this.getOrCreateFundAccount(params);
            const { data } = await axios_1.default.post(`${RAZORPAY_BASE}/payouts`, {
                account_number: this.config.get('RAZORPAY_ACCOUNT_NUMBER'),
                fund_account_id: fundAccountId,
                amount: Math.round(params.amountINR * 100),
                currency: 'INR',
                mode: 'IMPS',
                purpose: 'payout',
                queue_if_low_balance: true,
                notes: {
                    companionId: params.companionId,
                    payoutRecordId: params.payoutRecordId,
                },
                reference_id: params.payoutRecordId,
            }, { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } });
            this.logger.log(`Payout initiated: ${data.id} ₹${params.amountINR} → ${params.bankName}`);
            await this.prisma.payoutRecord.update({
                where: { id: params.payoutRecordId },
                data: { razorpayPayoutId: data.id, status: data.status },
            });
            return {
                razorpayPayoutId: data.id,
                status: data.status,
                utr: data.utr ?? null,
            };
        }
        catch (err) {
            this.logger.error('Razorpay payout failed', err?.response?.data ?? err.message);
            await this.prisma.payoutRecord.update({
                where: { id: params.payoutRecordId },
                data: { status: 'failed', failureReason: err?.response?.data?.error?.description ?? 'Payout failed' },
            });
            throw new common_1.InternalServerErrorException('Payout initiation failed');
        }
    }
    async getOrCreateFundAccount(params) {
        const kyc = await this.prisma.companionKYC.findUnique({
            where: { companionId: params.companionId },
            select: { razorpayFundAccountId: true },
        });
        if (kyc?.razorpayFundAccountId)
            return kyc.razorpayFundAccountId;
        const { data: contact } = await axios_1.default.post(`${RAZORPAY_BASE}/contacts`, {
            name: params.accountName,
            type: 'vendor',
            reference_id: params.companionId,
        }, { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } });
        const { data: fundAccount } = await axios_1.default.post(`${RAZORPAY_BASE}/fund_accounts`, {
            contact_id: contact.id,
            account_type: 'bank_account',
            bank_account: {
                name: params.accountName,
                ifsc: params.ifscCode,
                account_number: params.accountNumber,
            },
        }, { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } });
        await this.prisma.companionKYC.update({
            where: { companionId: params.companionId },
            data: { razorpayFundAccountId: fundAccount.id },
        });
        this.logger.log(`Fund account created: ${fundAccount.id} for companion ${params.companionId}`);
        return fundAccount.id;
    }
    async getPaymentStatus(razorpayOrderId) {
        const order = await this.prisma.razorpayOrder.findUnique({
            where: { razorpayOrderId },
        });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        return {
            orderId: order.razorpayOrderId,
            paymentId: order.razorpayPaymentId,
            status: order.status,
            amountINR: order.amountPaisa / 100,
            requestId: order.requestId,
        };
    }
    async initiateRefund(params) {
        try {
            const body = {
                speed: 'optimum',
                notes: { sessionId: params.sessionId ?? '', reason: params.reason ?? 'Booking cancelled' },
            };
            if (params.amountINR) {
                body.amount = Math.round(params.amountINR * 100);
            }
            const { data } = await axios_1.default.post(`${RAZORPAY_BASE}/payments/${params.razorpayPaymentId}/refund`, body, { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } });
            this.logger.log(`Refund initiated: ${data.id} ₹${(data.amount / 100)}`);
            return { refundId: data.id, status: data.status, amountINR: data.amount / 100 };
        }
        catch (err) {
            this.logger.error('Razorpay refund failed', err?.response?.data ?? err.message);
            throw new common_1.InternalServerErrorException('Refund initiation failed');
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map