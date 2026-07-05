import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EarningsService {
  private readonly logger = new Logger(EarningsService.name);
  constructor(private prisma: PrismaService) {}

  // ── GET /companion/earnings/summary — returns EarningsSummary interface ────

  async getSummary(companionId: string) {
    const [transactions, pendingTxs, companion] = await Promise.all([
      this.prisma.earningsTransaction.findMany({
        where: { companionId, status: { in: ['PAYOUT_ELIGIBLE', 'APPROVED'] } },
      }),
      this.prisma.earningsTransaction.findMany({
        where: { companionId, status: 'PENDING_REVIEW' },
      }),
      this.prisma.companion.findUnique({ where: { id: companionId } }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const availableBalance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const pendingBalance = pendingTxs.reduce((sum, t) => sum + Number(t.amount), 0);

    const monthTxs = await this.prisma.earningsTransaction.findMany({
      where: {
        companionId,
        createdAt: { gte: monthStart },
        type: { in: ['SESSION_EARNING', 'EXTENSION_EARNING', 'SAFETY_BONUS'] },
        status: { not: 'ON_HOLD' },
      },
    });
    const totalEarnedThisMonth = monthTxs.reduce((sum, t) => sum + Math.max(0, Number(t.amount)), 0);

    const sessionsThisMonth = await this.prisma.session.count({
      where: {
        companionId,
        status: 'COMPLETED',
        completedAt: { gte: monthStart },
      },
    });

    const onHold = await this.prisma.earningsTransaction.aggregate({
      where: { companionId, status: 'ON_HOLD' },
      _sum: { amount: true },
    });

    // Calculate next payout cycle (next 1st or 16th of month)
    const nextPayout = now.getDate() < 16
      ? new Date(now.getFullYear(), now.getMonth(), 16)
      : new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Returns EXACT EarningsSummary interface from store.types.ts
    return {
      availableBalance: Math.max(0, availableBalance),
      pendingBalance: Math.max(0, pendingBalance),
      totalEarnedAllTime: companion?.totalSessions ? companion.totalSessions * 700 : 0,
      totalEarnedThisMonth,
      totalSessionsThisMonth: sessionsThisMonth,
      nextPayoutCycleDate: nextPayout.toISOString().split('T')[0],
      safetyHoldAmount: Number(onHold._sum.amount ?? 0),
    };
  }

  // ── GET /companion/earnings/transactions ──────────────────────────────────

  async getTransactions(companionId: string, page = 1, limit = 20) {
    const [txs, total] = await Promise.all([
      this.prisma.earningsTransaction.findMany({
        where: { companionId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.earningsTransaction.count({ where: { companionId } }),
    ]);

    return {
      transactions: txs.map(t => this.toTransactionResponse(t)),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  // ── GET /companion/earnings/transactions/:transactionId ───────────────────

  async getTransaction(companionId: string, transactionId: string) {
    const tx = await this.prisma.earningsTransaction.findFirst({
      where: { id: transactionId, companionId },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return this.toTransactionResponse(tx);
  }

  // ── POST /companion/earnings/payout/request ───────────────────────────────

  async requestPayout(companionId: string, amount: number, bankMasked: string) {
    // Check available balance
    const summary = await this.getSummary(companionId);
    if (amount > summary.availableBalance) {
      throw new BadRequestException('Insufficient available balance');
    }
    if (amount < 100) throw new BadRequestException('Minimum payout amount is ₹100');

    const platformFee = Math.round(amount * 0.02); // 2% platform fee
    const netAmount = amount - platformFee;

    const payout = await this.prisma.payoutRecord.create({
      data: {
        companionId,
        status: 'REQUESTED',
        amount: netAmount,
        platformFee,
        maskedBank: bankMasked,
        requestedAt: new Date(),
      },
    });

    // Mark eligible transactions as used
    await this.prisma.earningsTransaction.create({
      data: {
        companionId,
        type: 'PAYOUT_TRANSFER',
        status: 'DEDUCTED',
        amount: -amount,
        description: `Payout to ${bankMasked}`,
        payoutId: payout.id,
      },
    });

    this.logger.log(`Payout requested: ${companionId} ₹${netAmount}`);

    return {
      payoutId: payout.id,
      status: 'requested',
      amount: netAmount,
      platformFee,
      maskedBank: bankMasked,
      message: 'Payout request submitted. Processing in 1-2 business days.',
    };
  }

  // ── GET /companion/earnings/payout/history ────────────────────────────────

  async getPayoutHistory(companionId: string, page = 1, limit = 20) {
    const [payouts, total] = await Promise.all([
      this.prisma.payoutRecord.findMany({
        where: { companionId },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payoutRecord.count({ where: { companionId } }),
    ]);

    return {
      payouts: payouts.map(p => this.toPayoutResponse(p)),
      total,
      page,
      limit,
    };
  }

  // ── GET /companion/earnings/payout/:payoutId ──────────────────────────────

  async getPayoutDetail(companionId: string, payoutId: string) {
    const payout = await this.prisma.payoutRecord.findFirst({
      where: { id: payoutId, companionId },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    return this.toPayoutResponse(payout);
  }

  // ── GET /companion/earnings/invoices ──────────────────────────────────────

  async getInvoices(companionId: string, page = 1, limit = 20) {
    // Invoices are completed sessions with earnings
    const sessions = await this.prisma.session.findMany({
      where: { companionId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      invoices: sessions.map((s, i) => ({
        invoiceId: `INV-${s.id.slice(0, 8).toUpperCase()}`,
        sessionId: s.id,
        date: s.completedAt?.toISOString() ?? s.createdAt.toISOString(),
        amount: Number(s.confirmedEarning ?? s.estimatedTotal),
        category: s.category.toLowerCase(),
        venueName: s.venueName,
        durationMinutes: s.durationMinutes,
        status: 'issued',
      })),
    };
  }

  // ── GET /companion/earnings/invoices/:invoiceId ───────────────────────────

  async getInvoiceDetail(companionId: string, invoiceId: string) {
    // Extract sessionId from invoiceId
    const sessionIdPrefix = invoiceId.replace('INV-', '').toLowerCase();
    const session = await this.prisma.session.findFirst({
      where: { companionId, status: 'COMPLETED', id: { startsWith: sessionIdPrefix } },
    });
    if (!session) throw new NotFoundException('Invoice not found');
    return {
      invoiceId,
      sessionId: session.id,
      date: session.completedAt?.toISOString(),
      amount: Number(session.confirmedEarning ?? session.estimatedTotal),
      breakdown: {
        baseEarning: Number(session.baseEarning),
        bonusEarning: Number(session.bonusEarning),
        platformFee: Math.round(Number(session.confirmedEarning ?? session.estimatedTotal) * 0.1),
      },
      category: session.category.toLowerCase(),
      venueName: session.venueName,
      durationMinutes: session.durationMinutes,
      language: session.language,
      status: 'issued',
    };
  }

  // ── Private mappers ───────────────────────────────────────────────────────

  private toTransactionResponse(t: any) {
    return {
      transactionId: t.id,
      type: t.type.toLowerCase(),
      status: t.status.toLowerCase(),
      amount: Number(t.amount),
      sessionId: t.sessionId ?? null,
      customerInitials: t.customerInitials ?? null,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      payoutEligibleAt: t.payoutEligibleAt?.toISOString() ?? null,
    };
  }

  private toPayoutResponse(p: any) {
    return {
      payoutId: p.id,
      status: p.status.toLowerCase(),
      amount: Number(p.amount),
      platformFee: Number(p.platformFee),
      maskedBank: p.maskedBank,
      utrNumber: p.utrNumber ?? null,
      requestedAt: p.requestedAt.toISOString(),
      completedAt: p.completedAt?.toISOString() ?? null,
      failureReason: p.failureReason ?? null,
    };
  }
}
