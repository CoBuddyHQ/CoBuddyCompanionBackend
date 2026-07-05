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
var EarningsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EarningsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let EarningsService = EarningsService_1 = class EarningsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EarningsService_1.name);
    }
    async getSummary(companionId) {
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
        const nextPayout = now.getDate() < 16
            ? new Date(now.getFullYear(), now.getMonth(), 16)
            : new Date(now.getFullYear(), now.getMonth() + 1, 1);
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
    async getTransactions(companionId, page = 1, limit = 20) {
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
    async getTransaction(companionId, transactionId) {
        const tx = await this.prisma.earningsTransaction.findFirst({
            where: { id: transactionId, companionId },
        });
        if (!tx)
            throw new common_1.NotFoundException('Transaction not found');
        return this.toTransactionResponse(tx);
    }
    async requestPayout(companionId, amount, bankMasked) {
        const summary = await this.getSummary(companionId);
        if (amount > summary.availableBalance) {
            throw new common_1.BadRequestException('Insufficient available balance');
        }
        if (amount < 100)
            throw new common_1.BadRequestException('Minimum payout amount is ₹100');
        const platformFee = Math.round(amount * 0.02);
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
    async getPayoutHistory(companionId, page = 1, limit = 20) {
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
    async getPayoutDetail(companionId, payoutId) {
        const payout = await this.prisma.payoutRecord.findFirst({
            where: { id: payoutId, companionId },
        });
        if (!payout)
            throw new common_1.NotFoundException('Payout not found');
        return this.toPayoutResponse(payout);
    }
    async getInvoices(companionId, page = 1, limit = 20) {
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
    async getInvoiceDetail(companionId, invoiceId) {
        const sessionIdPrefix = invoiceId.replace('INV-', '').toLowerCase();
        const session = await this.prisma.session.findFirst({
            where: { companionId, status: 'COMPLETED', id: { startsWith: sessionIdPrefix } },
        });
        if (!session)
            throw new common_1.NotFoundException('Invoice not found');
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
    toTransactionResponse(t) {
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
    toPayoutResponse(p) {
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
};
exports.EarningsService = EarningsService;
exports.EarningsService = EarningsService = EarningsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EarningsService);
//# sourceMappingURL=earnings.service.js.map