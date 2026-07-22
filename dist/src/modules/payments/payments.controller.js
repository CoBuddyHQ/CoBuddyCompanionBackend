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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
class CreateOrderDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'REQ-xyz123', description: 'Booking request ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "requestId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: 749, description: 'Amount in INR (full rupees)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "amountINR", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: '+919876543210' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerPhone", void 0);
class VerifyPaymentDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'Razorpay order_id from createOrder response' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'Razorpay payment_id from SDK checkout' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'HMAC-SHA256 signature from SDK checkout' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpaySignature", void 0);
class RefundDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'Razorpay payment_id to refund' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefundDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: 'Amount in INR (omit for full refund)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RefundDto.prototype, "amountINR", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefundDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefundDto.prototype, "sessionId", void 0);
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async razorpayWebhook(req, signature) {
        return this.paymentsService.handleWebhook(req.rawBody, signature);
    }
    createOrder(c, dto) {
        return this.paymentsService.createOrder({
            requestId: dto.requestId,
            amountINR: dto.amountINR,
            customerPhone: dto.customerPhone,
            companionId: c.sub,
        });
    }
    verifyPayment(dto) {
        return this.paymentsService.verifyPayment(dto);
    }
    getStatus(orderId) {
        return this.paymentsService.getPaymentStatus(orderId);
    }
    initiateRefund(dto) {
        return this.paymentsService.initiateRefund(dto);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Razorpay webhook (no auth — verified by signature)',
        description: `
      Events handled:
      • payment.captured → Booking confirmed, companion sees in inbox
      • payment.failed   → Booking stays draft, companion NOT notified
      • payout.processed → Companion PayoutRecord status = completed + UTR saved
      • payout.failed    → Companion PayoutRecord status = failed
      • refund.processed → Logged for audit
    `,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-razorpay-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "razorpayWebhook", null);
__decorate([
    (0, common_1.Post)('order'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create Razorpay order for booking payment',
        description: 'Returns { orderId, amount (paise), currency, key } for React Native Razorpay SDK',
    }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateOrderDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
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
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyPaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Get)('status/:orderId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment status by Razorpay orderId' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('refund'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate refund for cancelled booking',
        description: 'Partial or full refund via Razorpay. Platform fee is non-refundable.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefundDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "initiateRefund", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map