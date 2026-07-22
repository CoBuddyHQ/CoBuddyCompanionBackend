/**
 * PaymentsService — Razorpay Integration
 *
 * Uses Razorpay REST API directly via axios (no SDK needed — avoids version conflicts).
 * All keys come from environment variables — never hardcoded.
 *
 * PAYMENT FLOW (end-to-end):
 * ─────────────────────────────────────────────────────────────────────────────
 * [Customer App]                [Backend]                    [Razorpay]
 *       │                           │                             │
 *       │  POST /payments/order     │  createOrder()              │
 *       │─────────────────────────►│─────────────────────────────►│
 *       │◄─────────────────────────│◄─────────────────────────────│
 *       │  { orderId, amount, key } │                             │
 *       │                           │                             │
 *       │  (Customer pays in RN SDK)│                             │
 *       │──────────────────────────────────────────────────────────►│
 *       │◄──────────────────────────────────────────────────────────│
 *       │  { razorpay_payment_id, razorpay_signature }             │
 *       │                           │                             │
 *       │  POST /payments/verify    │  verifyPayment()            │
 *       │─────────────────────────►│                             │
 *       │◄─────────────────────────│ (BookingRequest → pending)  │
 *       │                          │ (Companion sees in inbox)   │
 *
 * PAYOUT FLOW (Companion withdrawal):
 * ─────────────────────────────────────────────────────────────────────────────
 * [Companion App]               [Backend]                    [Razorpay Payouts]
 *       │ POST /earnings/payout/request │                         │
 *       │─────────────────────────────►│  initiatePayout()       │
 *       │                              │─────────────────────────►│
 *       │◄─────────────────────────────│◄─────────────────────────│
 *       │  { payoutId, status }        │  (webhook updates DB)   │
 */

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Razorpay API base ───────────────────────────────────────────────────────
const RAZORPAY_BASE = 'https://api.razorpay.com/v1';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  private get keyId()     { return this.config.get<string>('RAZORPAY_KEY_ID', ''); }
  private get keySecret() { return this.config.get<string>('RAZORPAY_KEY_SECRET', ''); }
  private get webhookSecret() { return this.config.get<string>('RAZORPAY_WEBHOOK_SECRET', ''); }

  /** Auth header for Razorpay REST API (Basic Auth: key_id:key_secret) */
  private get razorpayAuth() {
    const cred = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    return { Authorization: `Basic ${cred}` };
  }

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // 1. CREATE ORDER — called when customer initiates booking
  //    Returns orderId + key for the React Native Razorpay SDK checkout
  // ─────────────────────────────────────────────────────────────────────────

  async createOrder(params: {
    requestId: string;
    amountINR: number;        // In full rupees (e.g. 749)
    customerPhone: string;
    companionId: string;
    notes?: Record<string, string>;
  }) {
    const amountPaisa = Math.round(params.amountINR * 100); // Razorpay takes paise

    try {
      const { data } = await axios.post(
        `${RAZORPAY_BASE}/orders`,
        {
          amount:   amountPaisa,
          currency: 'INR',
          receipt:  `REQ-${params.requestId.slice(-8)}`,
          notes: {
            requestId:   params.requestId,
            companionId: params.companionId,
            ...(params.notes ?? {}),
          },
        },
        { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } },
      );

      this.logger.log(`Razorpay order created: ${data.id} for ₹${params.amountINR}`);

      // Persist order reference so webhook can match it
      await this.prisma.razorpayOrder.create({
        data: {
          razorpayOrderId: data.id,
          requestId:       params.requestId,
          companionId:     params.companionId,
          amountPaisa,
          status:          'created',
        },
      });

      return {
        orderId:  data.id,
        amount:   amountPaisa,
        currency: 'INR',
        // Return key to React Native SDK — key_id is public
        key:      this.keyId,
      };
    } catch (err: any) {
      this.logger.error('Razorpay createOrder failed', err?.response?.data ?? err.message);
      throw new InternalServerErrorException('Payment order creation failed');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. VERIFY PAYMENT — called after customer completes payment in SDK
  //    Validates HMAC signature, marks booking as confirmed
  // ─────────────────────────────────────────────────────────────────────────

  async verifyPayment(params: {
    razorpayOrderId:   string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    // HMAC-SHA256: key = keySecret, data = "orderId|paymentId"
    const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
    const expected = createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    if (expected !== params.razorpaySignature) {
      this.logger.warn(`Payment signature mismatch for order ${params.razorpayOrderId}`);
      throw new BadRequestException('Invalid payment signature');
    }

    // Update order record
    const order = await this.prisma.razorpayOrder.update({
      where:  { razorpayOrderId: params.razorpayOrderId },
      data:   { status: 'paid', razorpayPaymentId: params.razorpayPaymentId },
    });

    // Activate the booking request so companion sees it in inbox
    if (order.requestId) {
      await this.prisma.bookingRequest.update({
        where: { id: order.requestId },
        data:  { paymentStatus: 'paid', status: 'pending' },
      });
    }

    this.logger.log(`Payment verified ✓ order=${params.razorpayOrderId} payment=${params.razorpayPaymentId}`);
    return { success: true, paymentId: params.razorpayPaymentId };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. WEBHOOK HANDLER — Razorpay server-side event (more reliable than client)
  //    Handles: payment.captured, payment.failed, payout.processed
  // ─────────────────────────────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string) {
    // Verify webhook signature
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      this.logger.warn('Webhook signature invalid — rejecting');
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    this.logger.log(`Razorpay webhook: ${event.event}`);

    switch (event.event) {

      // Payment captured — booking confirmed, companion sees request
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const order = await this.prisma.razorpayOrder.findUnique({ where: { razorpayOrderId: orderId } });
        if (order?.requestId) {
          await this.prisma.bookingRequest.update({
            where: { id: order.requestId },
            data:  { paymentStatus: 'paid', status: 'pending' },
          });
          await this.prisma.razorpayOrder.update({
            where: { razorpayOrderId: orderId },
            data:  { status: 'paid', razorpayPaymentId: payment.id },
          });
          this.logger.log(`Booking ${order.requestId} confirmed after payment capture`);
        }
        break;
      }

      // Payment failed — keep booking in draft/failed, don't notify companion
      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const order = await this.prisma.razorpayOrder.findUnique({ where: { razorpayOrderId: orderId } });
        if (order?.requestId) {
          await this.prisma.bookingRequest.update({
            where: { id: order.requestId },
            data:  { paymentStatus: 'failed' },
          });
          await this.prisma.razorpayOrder.update({
            where: { razorpayOrderId: orderId },
            data:  { status: 'failed' },
          });
          this.logger.warn(`Payment failed for booking ${order.requestId}`);
        }
        break;
      }

      // Payout processed — update companion's payout record
      case 'payout.processed': {
        const payout = event.payload.payout.entity;
        await this.prisma.payoutRecord.updateMany({
          where: { razorpayPayoutId: payout.id },
          data:  { status: 'completed', utrNumber: payout.utr, completedAt: new Date() },
        });
        this.logger.log(`Payout ${payout.id} processed. UTR: ${payout.utr}`);
        break;
      }

      // Payout failed — mark as failed so companion can retry
      case 'payout.failed': {
        const payout = event.payload.payout.entity;
        await this.prisma.payoutRecord.updateMany({
          where: { razorpayPayoutId: payout.id },
          data:  { status: 'failed', failureReason: payout.failure_reason },
        });
        this.logger.warn(`Payout ${payout.id} failed: ${payout.failure_reason}`);
        break;
      }

      // Refund processed — deduct from companion earnings if applicable
      case 'refund.processed': {
        const refund = event.payload.refund.entity;
        this.logger.log(`Refund processed: ${refund.id} — ₹${refund.amount / 100}`);
        // TODO: if refund is for companion cancellation, create a deduction transaction
        break;
      }

      default:
        this.logger.log(`Unhandled Razorpay event: ${event.event}`);
    }

    return { received: true };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. COMPANION PAYOUT — Razorpay Payout API
  //    Called by EarningsService.requestPayout()
  //    Creates Fund Account (if new) + fires payout to companion's bank
  // ─────────────────────────────────────────────────────────────────────────

  async initiateCompanionPayout(params: {
    companionId:    string;
    amountINR:      number;
    bankName:       string;
    accountNumber:  string;   // NEVER log this
    ifscCode:       string;
    accountName:    string;
    payoutRecordId: string;
  }): Promise<{
    razorpayPayoutId: string;
    status: string;
    utr:    string | null;
  }> {
    try {
      // Step 1: Create / retrieve Fund Account for this companion
      const fundAccountId = await this.getOrCreateFundAccount(params);

      // Step 2: Fire Payout
      const { data } = await axios.post(
        `${RAZORPAY_BASE}/payouts`,
        {
          account_number: this.config.get('RAZORPAY_ACCOUNT_NUMBER'), // Your RazorpayX account
          fund_account_id: fundAccountId,
          amount:          Math.round(params.amountINR * 100), // paise
          currency:        'INR',
          mode:            'IMPS',    // IMPS for ₹100-₹5L, NEFT for larger
          purpose:         'payout',
          queue_if_low_balance: true,
          notes: {
            companionId:    params.companionId,
            payoutRecordId: params.payoutRecordId,
          },
          reference_id: params.payoutRecordId,
        },
        { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } },
      );

      this.logger.log(`Payout initiated: ${data.id} ₹${params.amountINR} → ${params.bankName}`);

      // Update DB with Razorpay payout ID
      await this.prisma.payoutRecord.update({
        where: { id: params.payoutRecordId },
        data:  { razorpayPayoutId: data.id, status: data.status },
      });

      return {
        razorpayPayoutId: data.id,
        status:           data.status,
        utr:              data.utr ?? null,
      };
    } catch (err: any) {
      this.logger.error('Razorpay payout failed', err?.response?.data ?? err.message);
      // Mark payout record as failed
      await this.prisma.payoutRecord.update({
        where: { id: params.payoutRecordId },
        data:  { status: 'failed', failureReason: err?.response?.data?.error?.description ?? 'Payout failed' },
      });
      throw new InternalServerErrorException('Payout initiation failed');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private: Get or create Razorpay Fund Account for companion
  // ─────────────────────────────────────────────────────────────────────────

  private async getOrCreateFundAccount(params: {
    companionId:   string;
    accountNumber: string;
    ifscCode:      string;
    accountName:   string;
  }): Promise<string> {
    // Check if companion already has a fund account ID stored
    const kyc = await this.prisma.companionKYC.findUnique({
      where:  { companionId: params.companionId },
      select: { razorpayFundAccountId: true },
    });

    if (kyc?.razorpayFundAccountId) return kyc.razorpayFundAccountId;

    // Create a new Razorpay Contact + Fund Account
    // Step A: Create Contact
    const { data: contact } = await axios.post(
      `${RAZORPAY_BASE}/contacts`,
      {
        name:         params.accountName,
        type:         'vendor',
        reference_id: params.companionId,
      },
      { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } },
    );

    // Step B: Create Fund Account linked to contact
    const { data: fundAccount } = await axios.post(
      `${RAZORPAY_BASE}/fund_accounts`,
      {
        contact_id:   contact.id,
        account_type: 'bank_account',
        bank_account: {
          name:           params.accountName,
          ifsc:           params.ifscCode,
          account_number: params.accountNumber,
        },
      },
      { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } },
    );

    // Store fund account ID in KYC record so we don't recreate it
    await this.prisma.companionKYC.update({
      where: { companionId: params.companionId },
      data:  { razorpayFundAccountId: fundAccount.id },
    });

    this.logger.log(`Fund account created: ${fundAccount.id} for companion ${params.companionId}`);
    return fundAccount.id;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. GET PAYMENT STATUS — for polling from frontend
  // ─────────────────────────────────────────────────────────────────────────

  async getPaymentStatus(razorpayOrderId: string) {
    const order = await this.prisma.razorpayOrder.findUnique({
      where: { razorpayOrderId },
    });
    if (!order) throw new BadRequestException('Order not found');
    return {
      orderId:    order.razorpayOrderId,
      paymentId:  order.razorpayPaymentId,
      status:     order.status,
      amountINR:  order.amountPaisa / 100,
      requestId:  order.requestId,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. REFUND — platform-initiated refund for cancellations
  //    Called when companion cancels → customer gets full refund
  //    Called when customer cancels → platform-rule-based partial refund
  // ─────────────────────────────────────────────────────────────────────────

  async initiateRefund(params: {
    razorpayPaymentId: string;
    amountINR?:        number;   // Partial refund (null = full)
    reason?:           string;
    sessionId?:        string;
  }) {
    try {
      const body: Record<string, any> = {
        speed:  'optimum',  // optimum = instant if available, else 5-7 days
        notes:  { sessionId: params.sessionId ?? '', reason: params.reason ?? 'Booking cancelled' },
      };
      if (params.amountINR) {
        body.amount = Math.round(params.amountINR * 100);
      }

      const { data } = await axios.post(
        `${RAZORPAY_BASE}/payments/${params.razorpayPaymentId}/refund`,
        body,
        { headers: { ...this.razorpayAuth, 'Content-Type': 'application/json' } },
      );

      this.logger.log(`Refund initiated: ${data.id} ₹${(data.amount / 100)}`);
      return { refundId: data.id, status: data.status, amountINR: data.amount / 100 };
    } catch (err: any) {
      this.logger.error('Razorpay refund failed', err?.response?.data ?? err.message);
      throw new InternalServerErrorException('Refund initiation failed');
    }
  }
}
