/**
 * PaymentsController — Razorpay REST endpoints
 *
 * Public endpoints (no JWT):
 *   POST /payments/webhook        — Razorpay webhook (signature verified internally)
 *
 * Protected endpoints (JWT required):
 *   POST /payments/order          — Create Razorpay order for booking
 *   POST /payments/verify         — Verify payment after checkout
 *   GET  /payments/status/:orderId — Poll payment status
 *   POST /payments/refund         — Platform-initiated refund
 */

import {
  Controller, Post, Get, Body, Param, Headers, RawBodyRequest,
  UseGuards, HttpCode, HttpStatus, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Request } from 'express';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class CreateOrderDto {
  @ApiProperty({ example: 'REQ-xyz123', description: 'Booking request ID' })
  @IsString()
  requestId: string;

  @ApiProperty({ example: 749, description: 'Amount in INR (full rupees)' })
  @IsNumber() @Min(1)
  amountINR: number;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  customerPhone: string;
}

class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay order_id from createOrder response' })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ description: 'Razorpay payment_id from SDK checkout' })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'HMAC-SHA256 signature from SDK checkout' })
  @IsString()
  razorpaySignature: string;
}

class RefundDto {
  @ApiProperty({ description: 'Razorpay payment_id to refund' })
  @IsString()
  razorpayPaymentId: string;

  @ApiPropertyOptional({ description: 'Amount in INR (omit for full refund)' })
  @IsOptional() @IsNumber() @Min(1)
  amountINR?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  sessionId?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments/webhook
   * Razorpay server-to-server webhook. NO JWT — authenticated by signature header.
   * Must be registered in Razorpay Dashboard → Settings → Webhooks.
   * Raw body parsing MUST be enabled for signature validation.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Razorpay webhook (no auth — verified by signature)',
    description: `
      Events handled:
      • payment.captured → Booking confirmed, companion sees in inbox
      • payment.failed   → Booking stays draft, companion NOT notified
      • payout.processed → Companion PayoutRecord status = completed + UTR saved
      • payout.failed    → Companion PayoutRecord status = failed
      • refund.processed → Logged for audit
    `,
  })
  async razorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    // rawBody is populated by NestJS raw body middleware (configure in main.ts)
    return this.paymentsService.handleWebhook(req.rawBody!, signature);
  }

  /**
   * POST /payments/order
   * Creates a Razorpay Order for a booking. Returns orderId + key for React Native SDK.
   * The companion app does NOT call this — this is called by the CUSTOMER app.
   * Included here so both share 1 backend.
   */
  @Post('order')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('companion-jwt')
  @ApiOperation({
    summary: 'Create Razorpay order for booking payment',
    description: 'Returns { orderId, amount (paise), currency, key } for React Native Razorpay SDK',
  })
  createOrder(
    @CurrentCompanion() c: JwtPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.paymentsService.createOrder({
      requestId:    dto.requestId,
      amountINR:    dto.amountINR,
      customerPhone: dto.customerPhone,
      companionId:  c.sub,
    });
  }

  /**
   * POST /payments/verify
   * Called after customer completes Razorpay checkout in their app.
   * Validates HMAC-SHA256 signature → marks booking as payment confirmed.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Razorpay payment signature after checkout',
    description: `
      Frontend sends:
      {
        razorpayOrderId:   "order_xxx",
        razorpayPaymentId: "pay_xxx",
        razorpaySignature: "hmac_hex"
      }
      Backend validates HMAC-SHA256(orderId|paymentId, keySecret) before activating booking.
    `,
  })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  /**
   * GET /payments/status/:orderId
   * Frontend can poll this to check if payment was captured (e.g., if webhook is delayed).
   */
  @Get('status/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment status by Razorpay orderId' })
  getStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId);
  }

  /**
   * POST /payments/refund
   * Platform-initiated refund for cancellations.
   * Only callable by authenticated companions (or admin — add role guard for admin-only).
   */
  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('companion-jwt')
  @ApiOperation({
    summary: 'Initiate refund for cancelled booking',
    description: 'Partial or full refund via Razorpay. Platform fee is non-refundable.',
  })
  initiateRefund(@Body() dto: RefundDto) {
    return this.paymentsService.initiateRefund(dto);
  }
}
