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
exports.KycController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const kyc_service_1 = require("./kyc.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
const kyc_dto_1 = require("./dto/kyc.dto");
let KycController = class KycController {
    constructor(kycService) {
        this.kycService = kycService;
    }
    saveBasicDetails(c, dto) {
        return this.kycService.saveBasicDetails(c.sub, dto);
    }
    getStatus(c) {
        return this.kycService.getKycStatus(c.sub);
    }
    saveDraft(c, dto) {
        return this.kycService.saveDraft(c.sub, dto);
    }
    updateGovernmentIdType(c, dto) {
        return this.kycService.updateGovernmentIdType(c.sub, dto);
    }
    submitGovernmentId(c, dto) {
        return this.kycService.submitGovernmentId(c.sub, dto);
    }
    submitSelfie(c, dto) {
        return this.kycService.submitSelfie(c.sub, dto);
    }
    saveAddress(c, dto) {
        return this.kycService.saveAddress(c.sub, dto);
    }
    savePan(c, dto) {
        return this.kycService.savePan(c.sub, dto);
    }
    saveBank(c, dto) {
        return this.kycService.saveBank(c.sub, dto);
    }
    verifyBank(c, dto) {
        return this.kycService.verifyBank(c.sub, dto);
    }
    saveUpi(c, dto) {
        return this.kycService.saveUpi(c.sub, dto);
    }
    saveEmergencyContact(c, dto) {
        return this.kycService.saveEmergencyContact(c.sub, dto);
    }
    saveDeclaration(c, dto) {
        return this.kycService.saveDeclaration(c.sub, dto);
    }
    submitKyc(c) {
        return this.kycService.submitKyc(c.sub);
    }
    resubmitKyc(c, dto) {
        return this.kycService.resubmitKyc(c.sub, dto);
    }
};
exports.KycController = KycController;
__decorate([
    (0, common_1.Post)('companion/kyc/basic-details'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save basic details (Name, DOB, Gender, Email) — BasicDetailsScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.BasicDetailsDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "saveBasicDetails", null);
__decorate([
    (0, common_1.Get)('companion/kyc/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full KYC + verification status — VerificationHubScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('companion/application/draft'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save application progress as draft — ApplicationSavedDraftScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Post)('companion/kyc/government-id-type'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save selected government ID type — GovernmentIDTypeScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.UpdateGovernmentIdTypeDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "updateGovernmentIdType", null);
__decorate([
    (0, common_1.Post)('companion/kyc/government-id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Upload government ID — GovernmentIDUploadScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.SubmitGovernmentIdDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "submitGovernmentId", null);
__decorate([
    (0, common_1.Post)('companion/kyc/selfie'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Submit selfie/liveness video — SelfieCaptureScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.SubmitSelfieDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "submitSelfie", null);
__decorate([
    (0, common_1.Post)('companion/kyc/address'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save current residential address details — AddressVerificationScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.SaveAddressDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "saveAddress", null);
__decorate([
    (0, common_1.Post)('companion/kyc/pan'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save PAN details (masked) — PANTaxDetailsScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.SavePanDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "savePan", null);
__decorate([
    (0, common_1.Post)('companion/kyc/bank'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save bank account (last 4 digits only) — AddBankAccountScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.SaveBankDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "saveBank", null);
__decorate([
    (0, common_1.Post)('companion/kyc/bank/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify bank account via penny drop — BankAccountVerificationScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.VerifyBankDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "verifyBank", null);
__decorate([
    (0, common_1.Post)('companion/kyc/upi'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save UPI ID (masked) — UPIDetailsScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.SaveUpiDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "saveUpi", null);
__decorate([
    (0, common_1.Post)('companion/kyc/emergency-contact'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save emergency contact — EmergencyContactSetupScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "saveEmergencyContact", null);
__decorate([
    (0, common_1.Post)('companion/kyc/declaration'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm background declaration — BackgroundDeclarationScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_dto_1.SaveDeclarationDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "saveDeclaration", null);
__decorate([
    (0, common_1.Post)('companion/kyc/submit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Final KYC submission — SubmitProfileForApprovalScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "submitKyc", null);
__decorate([
    (0, common_1.Post)('companion/kyc/resubmit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resubmit after rejection — ResubmitVerificationScreen' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "resubmitKyc", null);
exports.KycController = KycController = __decorate([
    (0, swagger_1.ApiTags)('KYC'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [kyc_service_1.KycService])
], KycController);
//# sourceMappingURL=kyc.controller.js.map