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
exports.RequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const requests_service_1 = require("./requests.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
class DeclineRequestDto {
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeclineRequestDto.prototype, "reason", void 0);
class CounterProposeDto {
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CounterProposeDto.prototype, "newStart", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CounterProposeDto.prototype, "newEnd", void 0);
let RequestsController = class RequestsController {
    constructor(requestsService) {
        this.requestsService = requestsService;
    }
    getRequests(c, status, page = 1, limit = 20) {
        return this.requestsService.getRequests(c.sub, status, Number(page), Number(limit));
    }
    getRequest(c, requestId) {
        return this.requestsService.getRequest(c.sub, requestId);
    }
    getCustomerTrust(c, requestId) {
        return this.requestsService.getCustomerTrust(c.sub, requestId);
    }
    acceptRequest(c, requestId) {
        return this.requestsService.acceptRequest(c.sub, requestId);
    }
    declineRequest(c, requestId, dto) {
        return this.requestsService.declineRequest(c.sub, requestId, dto.reason);
    }
    counterPropose(c, requestId, dto) {
        return this.requestsService.counterPropose(c.sub, requestId, dto.newStart, dto.newEnd);
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['all', 'pending', 'expired', 'counter_proposed'] }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking requests inbox — returns BookingRequest[]' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Get)(':requestId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking request detail' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "getRequest", null);
__decorate([
    (0, common_1.Get)(':requestId/customer-trust'),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer trust snapshot' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "getCustomerTrust", null);
__decorate([
    (0, common_1.Post)(':requestId/accept'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Accept booking request — creates session' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "acceptRequest", null);
__decorate([
    (0, common_1.Post)(':requestId/decline'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Decline booking request' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, DeclineRequestDto]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "declineRequest", null);
__decorate([
    (0, common_1.Post)(':requestId/counter'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Counter-propose a different time' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CounterProposeDto]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "counterPropose", null);
exports.RequestsController = RequestsController = __decorate([
    (0, swagger_1.ApiTags)('Requests'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/requests'),
    __metadata("design:paramtypes", [requests_service_1.RequestsService])
], RequestsController);
//# sourceMappingURL=requests.controller.js.map