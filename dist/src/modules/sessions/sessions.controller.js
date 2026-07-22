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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sessions_service_1 = require("./sessions.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CheckInDto {
}
class VerifyCustomerDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'AR-642' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyCustomerDto.prototype, "passCode", void 0);
class ExtendSessionDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 60, description: '30–180 minutes' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(30),
    (0, class_validator_1.Max)(180),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ExtendSessionDto.prototype, "extraMinutes", void 0);
class EndEarlyDto {
}
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EndEarlyDto.prototype, "reason", void 0);
class CancelSessionDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'Health issue' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelSessionDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'I had a sudden migraine and cannot travel.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelSessionDto.prototype, "details", void 0);
class SessionNotesDto {
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionNotesDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionNotesDto.prototype, "mood", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SessionNotesDto.prototype, "tags", void 0);
class RateCustomerDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 5 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], RateCustomerDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RateCustomerDto.prototype, "feedback", void 0);
let SessionsController = class SessionsController {
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    getUpcoming(c) {
        return this.sessionsService.getUpcoming(c.sub);
    }
    getHistory(c, page = 1, limit = 20) {
        return this.sessionsService.getHistory(c.sub, Number(page), Number(limit));
    }
    getSession(c, sessionId) {
        return this.sessionsService.getSession(c.sub, sessionId);
    }
    getPass(c, sessionId) {
        return this.sessionsService.getSessionPass(c.sub, sessionId);
    }
    checkIn(c, sessionId) {
        return this.sessionsService.checkIn(c.sub, sessionId);
    }
    verifyCustomer(c, sessionId, dto) {
        return this.sessionsService.verifyCustomer(c.sub, sessionId, dto.passCode);
    }
    verifyBySelfie(c, sessionId, selfieUrl) {
        return this.sessionsService.verifyBySelfie(c.sub, sessionId, selfieUrl);
    }
    requestExtension(c, sessionId, dto) {
        return this.sessionsService.requestExtension(c.sub, sessionId, dto.extraMinutes);
    }
    confirmExtension(c, sessionId, dto) {
        return this.sessionsService.confirmExtension(c.sub, sessionId, dto.extraMinutes);
    }
    endEarly(c, sessionId, dto) {
        return this.sessionsService.endEarly(c.sub, sessionId, dto.reason);
    }
    cancelSession(c, sessionId, dto) {
        return this.sessionsService.cancelSession(c.sub, sessionId, dto.reason, dto.details);
    }
    getCancellationStatus(c, sessionId) {
        return this.sessionsService.getCancellationStatus(c.sub, sessionId);
    }
    reportNoShow(c, sessionId) {
        return this.sessionsService.reportNoShow(c.sub, sessionId);
    }
    completeSession(c, sessionId) {
        return this.sessionsService.completeSession(c.sub, sessionId);
    }
    saveNotes(c, sessionId, dto) {
        return this.sessionsService.saveNotes(c.sub, sessionId, dto.notes, dto.mood, dto.tags);
    }
    rateCustomer(c, sessionId, dto) {
        return this.sessionsService.rateCustomer(c.sub, sessionId, dto.rating, dto.feedback);
    }
    getChatHistory(c, sessionId) {
        return this.sessionsService.getChatHistory(c.sub, sessionId);
    }
    sendChatMessage(c, sessionId, text) {
        return this.sessionsService.sendChatMessage(c.sub, sessionId, text);
    }
    getCallToken(c, sessionId) {
        return this.sessionsService.getCallToken(c.sub, sessionId);
    }
    updateLocation(c, sessionId, lat, lng) {
        return this.sessionsService.updateLocation(c.sub, sessionId, lat, lng);
    }
    stopLocationSharing(c, sessionId) {
        return this.sessionsService.stopLocationSharing(c.sub, sessionId);
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, swagger_1.ApiOperation)({ summary: 'Get upcoming sessions — returns Session[] from store.types.ts' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session history with pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':sessionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session details' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "getSession", null);
__decorate([
    (0, common_1.Get)(':sessionId/pass'),
    (0, swagger_1.ApiOperation)({ summary: 'Get digital session pass' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "getPass", null);
__decorate([
    (0, common_1.Post)(':sessionId/checkin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Companion checks in at venue' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)(':sessionId/verify-customer'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify customer by pass code — activates session' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, VerifyCustomerDto]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "verifyCustomer", null);
__decorate([
    (0, common_1.Post)(':sessionId/verify-selfie'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify via venue selfie (fallback) — activates session' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)('selfieUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "verifyBySelfie", null);
__decorate([
    (0, common_1.Post)(':sessionId/extend/request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request session extension (30–180 min)' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ExtendSessionDto]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "requestExtension", null);
__decorate([
    (0, common_1.Post)(':sessionId/extend/confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm session extension after customer approval' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ExtendSessionDto]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "confirmExtension", null);
__decorate([
    (0, common_1.Post)(':sessionId/end-early'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'End session early' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, EndEarlyDto]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "endEarly", null);
__decorate([
    (0, common_1.Post)(':sessionId/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel upcoming session — two-step: reason + optional details' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CancelSessionDto]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "cancelSession", null);
__decorate([
    (0, common_1.Get)(':sessionId/cancellation-status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Poll cancellation review status — used by CancellationReviewPendingScreen (CPN-116)',
        description: 'Returns { status, reviewStatus, submittedAt, sessionId } so the screen can show Pending Review → Approved.',
    }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "getCancellationStatus", null);
__decorate([
    (0, common_1.Post)(':sessionId/no-show'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Report customer no-show' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "reportNoShow", null);
__decorate([
    (0, common_1.Post)(':sessionId/complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark session as completed — triggers earnings transaction' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "completeSession", null);
__decorate([
    (0, common_1.Post)(':sessionId/notes'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save post-session notes (private, not visible to customer)' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, SessionNotesDto]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "saveNotes", null);
__decorate([
    (0, common_1.Post)(':sessionId/rate-customer'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Rate customer (1–5) after session' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, RateCustomerDto]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "rateCustomer", null);
__decorate([
    (0, common_1.Get)(':sessionId/chat'),
    (0, swagger_1.ApiOperation)({ summary: 'Get in-session chat history' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "getChatHistory", null);
__decorate([
    (0, common_1.Post)(':sessionId/chat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send in-session chat message' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)('text')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "sendChatMessage", null);
__decorate([
    (0, common_1.Post)(':sessionId/call/token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get secure call token for VoIP' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "getCallToken", null);
__decorate([
    (0, common_1.Post)(':sessionId/location'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update live location during active session' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)('lat')),
    __param(3, (0, common_1.Body)('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Post)(':sessionId/location/stop'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Stop live location sharing early' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "stopLocationSharing", null);
exports.SessionsController = SessionsController = __decorate([
    (0, swagger_1.ApiTags)('Sessions'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/sessions'),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map