import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EarningsService } from './earnings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PayoutRequestDto {
  /**
   * Amount to withdraw — set by companion in PayoutRequestScreen.
   * Percentage shortcuts: 25% / 50% / 75% / MAX of availableBalance.
   * Min: ₹100 (MIN_PAYOUT constant on frontend).
   * Frontend sends only the amount; bankMasked is derived server-side from
   * the companion's KYC-verified bank account in the DB.
   */
  @ApiProperty({ example: 3375, description: 'Amount in INR (min ₹100)' })
  @IsNumber() @Min(100)
  @Type(() => Number)
  amount: number;
}

@ApiTags('Earnings')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  /** GET /companion/earnings/summary — Endpoints.EARNINGS.SUMMARY */
  @Get('summary')
  @ApiOperation({ summary: 'Get earnings summary — returns EarningsSummary interface' })
  getSummary(@CurrentCompanion() c: JwtPayload) {
    return this.earningsService.getSummary(c.sub);
  }

  /** GET /companion/earnings/transactions — Endpoints.EARNINGS.TRANSACTIONS */
  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history — returns Transaction[]' })
  getTransactions(
    @CurrentCompanion() c: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.earningsService.getTransactions(c.sub, Number(page), Number(limit));
  }

  /** GET /companion/earnings/transactions/:transactionId — Endpoints.EARNINGS.TRANSACTION_DETAIL */
  @Get('transactions/:transactionId')
  @ApiOperation({ summary: 'Get transaction detail' })
  getTransaction(@CurrentCompanion() c: JwtPayload, @Param('transactionId') id: string) {
    return this.earningsService.getTransaction(c.sub, id);
  }

  /** GET /companion/earnings/payout/history — Endpoints.EARNINGS.PAYOUT_HISTORY */
  @Get('payout/history')
  @ApiOperation({ summary: 'Get payout history — returns PayoutRecord[]' })
  getPayoutHistory(@CurrentCompanion() c: JwtPayload, @Query('page') page = 1) {
    return this.earningsService.getPayoutHistory(c.sub, Number(page));
  }

  /** POST /companion/earnings/payout/request — Endpoints.EARNINGS.PAYOUT_REQUEST */
  @Post('payout/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request payout — PayoutReviewScreen (CPN-106) calls this after Confirm button',
    description:
      'Frontend sends only `amount`. Backend derives masked bank from companion KYC record. ' +
      'Returns { payoutId, status, amount, platformFee, maskedBank, estimatedArrival }',
  })
  requestPayout(@CurrentCompanion() c: JwtPayload, @Body() dto: PayoutRequestDto) {
    return this.earningsService.requestPayout(c.sub, dto.amount);
  }

  /** GET /companion/earnings/weekly — Endpoints.EARNINGS.WEEKLY */
  @Get('weekly')
  @ApiOperation({
    summary: 'Weekly earnings breakdown — used by EarningsDashboardScreen (CPN-137) and WeeklyMonthlyEarningsScreen',
    description: 'Returns { thisWeekEarnings, lastWeekEarnings, weeklyBreakdown[] } matching the dashboard widget',
  })
  getWeeklyEarnings(@CurrentCompanion() c: JwtPayload) {
    return this.earningsService.getWeeklyEarnings(c.sub);
  }

  /** GET /companion/earnings/daily — Endpoints.EARNINGS.DAILY */
  @Get('daily')
  @ApiOperation({
    summary: 'Daily earnings breakdown — used by DailyEarningsBreakdownScreen',
    description: 'Returns todays session earnings, tips, bonus broken by hour',
  })
  getDailyEarnings(@CurrentCompanion() c: JwtPayload) {
    return this.earningsService.getDailyEarnings(c.sub);
  }

  /** GET /companion/earnings/pending — Endpoints.EARNINGS.PENDING */
  @Get('pending')
  @ApiOperation({
    summary: 'Pending earnings awaiting 48h clearance — used by PendingEarningsScreen',
    description: 'Returns list of pending transactions with payoutEligibleAt timestamps',
  })
  getPendingEarnings(@CurrentCompanion() c: JwtPayload) {
    return this.earningsService.getPendingEarnings(c.sub);
  }

  /** GET /companion/earnings/payout/:payoutId — Endpoints.EARNINGS.PAYOUT_DETAIL */
  @Get('payout/:payoutId')
  @ApiOperation({ summary: 'Get payout detail' })
  getPayoutDetail(@CurrentCompanion() c: JwtPayload, @Param('payoutId') payoutId: string) {
    return this.earningsService.getPayoutDetail(c.sub, payoutId);
  }

  /** GET /companion/earnings/invoices — Endpoints.EARNINGS.INVOICE_LIST */
  @Get('invoices')
  @ApiOperation({ summary: 'Get tax invoices list' })
  getInvoices(@CurrentCompanion() c: JwtPayload, @Query('page') page = 1) {
    return this.earningsService.getInvoices(c.sub, Number(page));
  }

  /** GET /companion/earnings/invoices/:invoiceId — Endpoints.EARNINGS.INVOICE_DETAIL */
  @Get('invoices/:invoiceId')
  @ApiOperation({ summary: 'Get invoice detail' })
  getInvoiceDetail(@CurrentCompanion() c: JwtPayload, @Param('invoiceId') invoiceId: string) {
    return this.earningsService.getInvoiceDetail(c.sub, invoiceId);
  }
}
