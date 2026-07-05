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
  @ApiProperty({ example: 2000 })
  @IsNumber() @Min(100)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: '•••• 4821' })
  @IsString()
  bankMasked: string;
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
  @ApiOperation({ summary: 'Request payout to bank account' })
  requestPayout(@CurrentCompanion() c: JwtPayload, @Body() dto: PayoutRequestDto) {
    return this.earningsService.requestPayout(c.sub, dto.amount, dto.bankMasked);
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
