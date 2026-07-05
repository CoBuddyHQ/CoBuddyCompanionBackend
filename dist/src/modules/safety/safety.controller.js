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
exports.SafetyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const safety_service_1 = require("./safety.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class SOSTriggerDto {
}
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SOSTriggerDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SOSTriggerDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SOSTriggerDto.prototype, "lng", void 0);
class SOSResolveDto {
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SOSResolveDto.prototype, "sosId", void 0);
class TimerStartDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 30 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(240),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], TimerStartDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TimerStartDto.prototype, "sessionId", void 0);
class AddContactDto {
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddContactDto.prototype, "name", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddContactDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddContactDto.prototype, "relationship", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AddContactDto.prototype, "isEmergencyContact", void 0);
class UpdateContactDto {
}
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContactDto.prototype, "name", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContactDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContactDto.prototype, "relationship", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateContactDto.prototype, "isEmergencyContact", void 0);
class BlockCustomerDto {
}
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BlockCustomerDto.prototype, "reason", void 0);
class ReportCustomerDto {
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportCustomerDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportCustomerDto.prototype, "sessionId", void 0);
class IncidentDto {
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IncidentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IncidentDto.prototype, "sessionId", void 0);
class EvidenceDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], EvidenceDto.prototype, "evidenceUrls", void 0);
let SafetyController = class SafetyController {
    constructor(safetyService) {
        this.safetyService = safetyService;
    }
    triggerSOS(c, dto) {
        return this.safetyService.triggerSOS(c.sub, dto.sessionId, dto.lat, dto.lng);
    }
    resolveSOS(c, dto) {
        return this.safetyService.resolveSOS(c.sub, dto.sosId);
    }
    startTimer(c, dto) {
        return this.safetyService.startTimer(c.sub, dto.durationMinutes, dto.sessionId);
    }
    checkinTimer(c) {
        return this.safetyService.checkinTimer(c.sub);
    }
    cancelTimer(c) {
        return this.safetyService.cancelTimer(c.sub);
    }
    getTrustedContacts(c) {
        return this.safetyService.getTrustedContacts(c.sub);
    }
    addContact(c, dto) {
        return this.safetyService.addTrustedContact(c.sub, dto);
    }
    updateContact(c, id, dto) {
        return this.safetyService.updateTrustedContact(c.sub, id, dto);
    }
    deleteContact(c, id) {
        return this.safetyService.deleteTrustedContact(c.sub, id);
    }
    blockCustomer(c, cid, dto) {
        return this.safetyService.blockCustomer(c.sub, cid, dto.reason);
    }
    reportCustomer(c, cid, dto) {
        return this.safetyService.reportCustomer(c.sub, cid, dto.reason, dto.sessionId);
    }
    reportIncident(c, dto) {
        return this.safetyService.reportIncident(c.sub, dto.description, dto.sessionId);
    }
    uploadEvidence(c, rid, dto) {
        return this.safetyService.uploadEvidence(c.sub, rid, dto.evidenceUrls);
    }
};
exports.SafetyController = SafetyController;
__decorate([
    (0, common_1.Post)('sos/trigger'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger SOS alert — Endpoints.SAFETY.SOS_TRIGGER' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SOSTriggerDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "triggerSOS", null);
__decorate([
    (0, common_1.Post)('sos/resolve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve SOS — Endpoints.SAFETY.SOS_RESOLVE' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SOSResolveDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "resolveSOS", null);
__decorate([
    (0, common_1.Post)('timer/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Start safety timer — Endpoints.SAFETY.TIMER_START' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, TimerStartDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "startTimer", null);
__decorate([
    (0, common_1.Post)('timer/checkin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Safety timer check-in — Endpoints.SAFETY.TIMER_CHECKIN' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "checkinTimer", null);
__decorate([
    (0, common_1.Post)('timer/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel safety timer — Endpoints.SAFETY.TIMER_CANCEL' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "cancelTimer", null);
__decorate([
    (0, common_1.Get)('trusted-contacts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trusted contacts — Endpoints.SAFETY.TRUSTED_CONTACTS' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "getTrustedContacts", null);
__decorate([
    (0, common_1.Post)('trusted-contacts/add'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Add trusted contact — Endpoints.SAFETY.TRUSTED_ADD' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AddContactDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "addContact", null);
__decorate([
    (0, common_1.Put)('trusted-contacts/:contactId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update trusted contact — Endpoints.SAFETY.TRUSTED_UPDATE' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('contactId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateContactDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "updateContact", null);
__decorate([
    (0, common_1.Delete)('trusted-contacts/:contactId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete trusted contact — Endpoints.SAFETY.TRUSTED_DELETE' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "deleteContact", null);
__decorate([
    (0, common_1.Post)('block/:customerId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Block customer — Endpoints.SAFETY.BLOCK_CUSTOMER' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('customerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, BlockCustomerDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "blockCustomer", null);
__decorate([
    (0, common_1.Post)('report/:customerId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Report customer — Endpoints.SAFETY.REPORT_CUSTOMER' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('customerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ReportCustomerDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "reportCustomer", null);
__decorate([
    (0, common_1.Post)('incident'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Submit incident report — Endpoints.SAFETY.INCIDENT_REPORT' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, IncidentDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "reportIncident", null);
__decorate([
    (0, common_1.Post)('incident/:reportId/evidence'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Upload incident evidence — Endpoints.SAFETY.INCIDENT_EVIDENCE' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('reportId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, EvidenceDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "uploadEvidence", null);
exports.SafetyController = SafetyController = __decorate([
    (0, swagger_1.ApiTags)('Safety'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/safety'),
    __metadata("design:paramtypes", [safety_service_1.SafetyService])
], SafetyController);
//# sourceMappingURL=safety.controller.js.map