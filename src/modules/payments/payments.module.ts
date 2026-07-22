/**
 * PaymentsModule — Razorpay Integration
 *
 * Flow:
 * 1. Customer creates booking → Backend creates Razorpay Order (via Customer API)
 * 2. Customer pays via Razorpay SDK on their app
 * 3. Razorpay fires webhook → /payments/webhook → Backend verifies signature
 * 4. On payment.captured: BookingRequest status → pending (companion sees it in inbox)
 * 5. On payment.failed: BookingRequest status → failed (companion never sees it)
 * 6. Companion payout → Razorpay Payout API (Fund Account + Payout)
 *
 * NOTE: This is the COMPANION BACKEND. Companion never pays; they receive payouts.
 * The Razorpay Order creation is done here so both apps share 1 backend.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
