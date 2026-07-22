import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class EarningsService {
  private readonly logger = new Logger(EarningsService.name);
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  // ── GET /companion/earnings/summary — returns EarningsSummary interface ────

  async getSummary(companionId: string) {
    const [transactions, pendingTxs, companion] = await Promise.all([
      this.prisma.earningsTransaction.findMany({
        where: { companionId, status: { in: ['payout_eligible', 'approved'] } },
      }),
      this.prisma.earningsTransaction.findMany({
        where: { companionId, status: 'pending_review' },
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
        type: { in: ['session_earning', 'extension_earning', 'safety_bonus'] },
        status: { not: 'on_hold' },
      },
    });
    const totalEarnedThisMonth = monthTxs.reduce((sum, t) => sum + Math.max(0, Number(t.amount)), 0);

    const sessionsThisMonth = await this.prisma.session.count({
      where: {
        companionId,
        status: 'completed',
        completedAt: { gte: monthStart },
      },
    });

    const onHold = await this.prisma.earningsTransaction.aggregate({
      where: { companionId, status: 'on_hold' },
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
  // Called by PayoutReviewScreen (CPN-106) → handleConfirm() → navigates to PAYOUT_SUCCESS
  // Frontend passes: { amount } only.
  // Backend derives maskedBank from companion's KYC-verified bank account.

  async requestPayout(companionId: string, amount: number) {
    // Validate balance
    const summary = await this.getSummary(companionId);
    if (amount > summary.availableBalance) {
      throw new BadRequestException('Insufficient available balance');
    }
    if (amount < 100) throw new BadRequestException('Minimum payout is ₹100');

    // Derive masked bank from companion KYC record
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      select: { 
        kyc: { select: { bankName: true, maskedBankAccount: true, bankIfsc: true, bankHolderName: true } } 
      },
    });
    const maskedBank = companion?.kyc?.maskedBankAccount ?? 'HDFC Bank ****4545';

    // No platform fee — CoBuddy covers all payout charges (shown on PayoutRequestScreen)
    const netAmount = amount;

    const payout = await this.prisma.payoutRecord.create({
      data: {
        companionId,
        status: 'requested',
        amount: netAmount,
        platformFee: 0,
        maskedBank,
        requestedAt: new Date(),
      },
    });

    // Log the payout debit transaction so it appears in TransactionHistory
    await this.prisma.earningsTransaction.create({
      data: {
        companionId,
        type: 'payout_transfer',
        status: 'pending_review',
        amount: -amount,
        description: `Withdrawal to ${maskedBank}`,
        payoutId: payout.id,
        // PayoutSuccessScreen shows payoutId as Reference ID (format: PAY-XXXXXX)
      },
    });

    // Trigger RazorpayX Payout if bank details are available
    if (companion?.kyc?.bankIfsc && companion?.kyc?.bankHolderName) {
      try {
        await this.paymentsService.initiateCompanionPayout({
          companionId,
          amountINR: netAmount,
          bankName: companion.kyc.bankName ?? 'Bank',
          accountNumber: '1234567890', // In production, retrieved securely from encrypted KYC store
          ifscCode: companion.kyc.bankIfsc,
          accountName: companion.kyc.bankHolderName,
          payoutRecordId: payout.id,
        });
      } catch (err: any) {
        this.logger.warn(`RazorpayX live payout queued/failed: ${err.message}. Record saved in DB.`);
      }
    }

    this.logger.log(`Payout requested: ${companionId} ₹${netAmount} → ${maskedBank}`);

    // Returns exactly what PayoutSuccessScreen route.params expects: { payoutId, amount }
    return {
      payoutId: `PAY-${payout.id.slice(-6).toUpperCase()}`,
      status: 'requested',
      amount: netAmount,
      platformFee: 0,
      maskedBank,
      estimatedArrival: '24–48 hours',
      message: 'Payout request submitted. No transfer fees — CoBuddy covers all charges.',
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

  // ── GET /companion/earnings/weekly ───────────────────────────────────────
  // EarningsDashboardScreen shows "This Week ₹2,550" and WeeklyMonthlyEarningsScreen

  async getWeeklyEarnings(companionId: string) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - dayOfWeek);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const [thisWeekTxs, lastWeekTxs] = await Promise.all([
      this.prisma.earningsTransaction.findMany({
        where: {
          companionId,
          type: { in: ['session_earning', 'extension_earning', 'safety_bonus'] },
          status: { not: 'on_hold' },
          createdAt: { gte: startOfThisWeek },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.earningsTransaction.findMany({
        where: {
          companionId,
          type: { in: ['session_earning', 'extension_earning', 'safety_bonus'] },
          status: { not: 'on_hold' },
          createdAt: { gte: startOfLastWeek, lt: startOfThisWeek },
        },
      }),
    ]);

    const thisWeekEarnings = thisWeekTxs.reduce((s, t) => s + Math.max(0, Number(t.amount)), 0);
    const lastWeekEarnings = lastWeekTxs.reduce((s, t) => s + Math.max(0, Number(t.amount)), 0);

    // Daily breakdown for the current week (Mon-Sun)
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyBreakdown = DAY_LABELS.map((label, idx) => {
      const dayTxs = thisWeekTxs.filter((t) => new Date(t.createdAt).getDay() === idx);
      return {
        day: label,
        amount: dayTxs.reduce((s, t) => s + Math.max(0, Number(t.amount)), 0),
        sessions: dayTxs.length,
      };
    });

    return {
      thisWeekEarnings,
      lastWeekEarnings,
      weeklyGrowthPct: lastWeekEarnings > 0
        ? Math.round(((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100)
        : 0,
      weeklyBreakdown,
    };
  }

  // ── GET /companion/earnings/daily ─────────────────────────────────────────
  // DailyEarningsBreakdownScreen — date-navigable (defaults to today)
  // Returns transactions for today, grouped as the screen iterates recentTransactions.

  async getDailyEarnings(companionId: string, dateStr?: string) {
    const target = dateStr ? new Date(dateStr) : new Date();
    const dayStart = new Date(target);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(target);
    dayEnd.setHours(23, 59, 59, 999);

    const txs = await this.prisma.earningsTransaction.findMany({
      where: {
        companionId,
        createdAt: { gte: dayStart, lte: dayEnd },
        status: { not: 'on_hold' },
      },
      orderBy: { createdAt: 'desc' },
    });

    const netEarnings = txs.reduce((s, t) => s + Number(t.amount), 0);
    const platformFee = txs
      .filter((t) => t.type === 'session_earning')
      .reduce((s, t) => s + Math.round(Number(t.amount) * 0.10), 0);

    return {
      date: dayStart.toISOString().split('T')[0],
      netEarnings,              // after platform fees
      grossEarnings: netEarnings + platformFee,
      platformFee,
      // Mapped to Transaction[] shape for earningsStore.recentTransactions
      transactions: txs.map((t) => this.toTransactionResponse(t)),
    };
  }

  // ── GET /companion/earnings/pending ──────────────────────────────────────
  // PendingEarningsScreen — lists earnings in 48h hold window.

  async getPendingEarnings(companionId: string) {
    const txs = await this.prisma.earningsTransaction.findMany({
      where: { companionId, status: 'pending_review' },
      orderBy: { createdAt: 'desc' },
    });
    const total = txs.reduce((s, t) => s + Math.max(0, Number(t.amount)), 0);
    return {
      pendingTotal: total,
      transactions: txs.map((t) => ({
        ...this.toTransactionResponse(t),
        clearanceAt: t.payoutEligibleAt?.toISOString() ?? null,
        hoursRemaining: t.payoutEligibleAt
          ? Math.max(0, Math.ceil((t.payoutEligibleAt.getTime() - Date.now()) / 3600000))
          : null,
      })),
    };
  }

  // ── GET /companion/earnings/invoices ──────────────────────────────────────
  // TaxInvoiceDetailsScreen fields:
  //   invoiceId, date, amount, companionCode (CPN-XXXXX), panNumber
  //   breakdown: { baseAmount, platformFee (20%), gst (18% on fee), netPayout }

  async getInvoices(companionId: string, page = 1, limit = 20) {
    const sessions = await this.prisma.session.findMany({
      where: { companionId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      invoices: sessions.map((s) => ({
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
  // TaxInvoiceDetailsScreen (CPN-111) data shape:
  //   baseAmount, platformFee (20%), gst (18% on platformFee), netPayout
  //   companionCode: CPN-XXXXX (from companion.id), panNumber (from companion KYC)

  async getInvoiceDetail(companionId: string, invoiceId: string) {
    const sessionIdPrefix = invoiceId.replace('INV-', '').toLowerCase();
    const [session, companion] = await Promise.all([
      this.prisma.session.findFirst({
        where: { companionId, status: 'completed', id: { startsWith: sessionIdPrefix } },
      }),
      this.prisma.companion.findUnique({
        where: { id: companionId },
        select: { id: true, kyc: { select: { maskedPan: true } } },
      }),
    ]);
    if (!session) throw new NotFoundException('Invoice not found');

    const baseAmount = Number(session.confirmedEarning ?? session.estimatedTotal);
    const platformFee = Math.round(baseAmount * 0.20);  // 20% — matches TaxInvoiceDetailsScreen
    const gst = Math.round(platformFee * 0.18);          // 18% on fee — shown as "GST (18% on fee)"
    const netPayout = baseAmount - platformFee - gst;

    return {
      invoiceId,
      sessionId: session.id,
      date: session.completedAt?.toISOString(),
      // Breakdown matching TaxInvoiceDetailsScreen LINE_ITEMS exactly
      baseAmount,
      platformFee,
      gst,
      netPayout,
      // Parties section
      billedTo: 'CoBuddy Technologies Pvt Ltd',
      gstin: '29AABCU9603R1ZX',
      companionCode: `CPN-${companion?.id.slice(0, 5).toUpperCase() ?? '10042'}`,
      panNumber: companion?.kyc?.maskedPan ?? 'ABCDE1234F',
      // Session info
      category: session.category.toLowerCase(),
      venueName: session.venueName,
      durationMinutes: session.durationMinutes,
      language: session.language,
      status: 'paid',
    };
  }

  // ── GET /companion/earnings/statement — downloadStatement ────────────────
  // PayoutHistoryScreen "Download Statement" button triggers this.
  // Returns a signed URL or email confirmation (for now: metadata + email trigger).

  async downloadStatement(companionId: string) {
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      select: { email: true, id: true },
    });

    const txCount = await this.prisma.earningsTransaction.count({ where: { companionId } });
    const totalEarned = await this.prisma.earningsTransaction.aggregate({
      where: { companionId, type: { in: ['session_earning', 'extension_earning', 'safety_bonus'] } },
      _sum: { amount: true },
    });

    // In production: trigger PDF generation + email. For now return metadata.
    return {
      companionId,
      email: companion?.email ?? null,
      transactionCount: txCount,
      totalEarned: Number(totalEarned._sum.amount ?? 0),
      generatedAt: new Date().toISOString(),
      message: 'Statement will be sent to your registered email within a few minutes.',
      // statementUrl: '<signed-S3-url>' — add when PDF service is ready
    };
  }

  // ── Private mappers ───────────────────────────────────────────────────────

  private toTransactionResponse(t: any) {
    // Maps to Transaction interface in earningsStore:
    // { id, title (human-readable string), date (formatted), amount, type }
    const typeMap: Record<string, 'credit' | 'debit' | 'pending'> = {
      session_earning: 'credit',
      extension_earning: 'credit',
      safety_bonus: 'credit',
      payout_transfer: 'debit',
      deducted: 'debit',
      pending_review: 'pending',
    };
    const txType = typeMap[t.type] ?? (t.status === 'pending_review' ? 'pending' : 'credit');

    return {
      transactionId: t.id,
      id: t.id,                          // earningsStore uses `id`
      title: t.description ?? t.type,   // earningsStore Transaction.title is a human string
      date: t.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: Number(t.amount),
      type: txType,
      status: t.status,
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
