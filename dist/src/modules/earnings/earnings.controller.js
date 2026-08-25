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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EarningsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const earnings_service_1 = require("./earnings.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class PayoutRequestDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 3375, description: 'Amount in INR (min ₹100)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PayoutRequestDto.prototype, "amount", void 0);
let EarningsController = class EarningsController {
    constructor(earningsService) {
        this.earningsService = earningsService;
    }
    getSummary(c) {
        return this.earningsService.getSummary(c.sub);
    }
    getTransactions(c, page = 1, limit = 20) {
        return this.earningsService.getTransactions(c.sub, Number(page), Number(limit));
    }
    getTransaction(c, id) {
        return this.earningsService.getTransaction(c.sub, id);
    }
    getPayoutHistory(c, page = 1) {
        return this.earningsService.getPayoutHistory(c.sub, Number(page));
    }
    requestPayout(c, dto) {
        return this.earningsService.requestPayout(c.sub, dto.amount);
    }
    getWeeklyEarnings(c) {
        return this.earningsService.getWeeklyEarnings(c.sub);
    }
    getDailyEarnings(c) {
        return this.earningsService.getDailyEarnings(c.sub);
    }
    getPendingEarnings(c) {
        return this.earningsService.getPendingEarnings(c.sub);
    }
    getPayoutDetail(c, payoutId) {
        return this.earningsService.getPayoutDetail(c.sub, payoutId);
    }
    getInvoices(c, page = 1) {
        return this.earningsService.getInvoices(c.sub, Number(page));
    }
    getInvoiceDetail(c, invoiceId) {
        return this.earningsService.getInvoiceDetail(c.sub, invoiceId);
    }
    downloadStatement(c) {
        return this.earningsService.downloadStatement(c.sub);
    }
};
exports.EarningsController = EarningsController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get earnings summary — returns EarningsSummary interface' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get transaction history — returns Transaction[]' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('transactions/:transactionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get transaction detail' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getTransaction", null);
__decorate([
    (0, common_1.Get)('payout/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payout history — returns PayoutRecord[]' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getPayoutHistory", null);
__decorate([
    (0, common_1.Post)('payout/request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Request payout — PayoutReviewScreen (CPN-106) calls this after Confirm button',
        description: 'Frontend sends only `amount`. Backend derives masked bank from companion KYC record. ' +
            'Returns { payoutId, status, amount, platformFee, maskedBank, estimatedArrival }',
    }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PayoutRequestDto]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.Get)('weekly'),
    (0, swagger_1.ApiOperation)({
        summary: 'Weekly earnings breakdown — used by EarningsDashboardScreen (CPN-137) and WeeklyMonthlyEarningsScreen',
        description: 'Returns { thisWeekEarnings, lastWeekEarnings, weeklyBreakdown[] } matching the dashboard widget',
    }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getWeeklyEarnings", null);
__decorate([
    (0, common_1.Get)('daily'),
    (0, swagger_1.ApiOperation)({
        summary: 'Daily earnings breakdown — used by DailyEarningsBreakdownScreen',
        description: 'Returns todays session earnings, tips, bonus broken by hour',
    }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getDailyEarnings", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({
        summary: 'Pending earnings awaiting 48h clearance — used by PendingEarningsScreen',
        description: 'Returns list of pending transactions with payoutEligibleAt timestamps',
    }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getPendingEarnings", null);
__decorate([
    (0, common_1.Get)('payout/:payoutId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payout detail' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('payoutId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getPayoutDetail", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tax invoices list' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:invoiceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoice detail' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('invoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "getInvoiceDetail", null);
__decorate([
    (0, common_1.Get)('statement'),
    (0, swagger_1.ApiOperation)({ summary: 'Download earnings statement — triggers email with PDF' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EarningsController.prototype, "downloadStatement", null);
exports.EarningsController = EarningsController = __decorate([
    (0, swagger_1.ApiTags)('Earnings'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/earnings'),
    __metadata("design:paramtypes", [earnings_service_1.EarningsService])
], EarningsController);
//# sourceMappingURL=earnings.controller.js.map