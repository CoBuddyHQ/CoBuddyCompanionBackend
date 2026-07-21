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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitSelfieDto = exports.SubmitGovernmentIdDto = exports.UpdateGovernmentIdTypeDto = exports.SaveDeclarationDto = exports.BasicDetailsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class BasicDetailsDto {
}
exports.BasicDetailsDto = BasicDetailsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Aditi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BasicDetailsDto.prototype, "legalFirstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sharma' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BasicDetailsDto.prototype, "legalLastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Adi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BasicDetailsDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'aditi@example.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], BasicDetailsDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1995-08-15T00:00:00.000Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BasicDetailsDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Female' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BasicDetailsDto.prototype, "gender", void 0);
class SaveDeclarationDto {
}
exports.SaveDeclarationDto = SaveDeclarationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SaveDeclarationDto.prototype, "accurateInfo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SaveDeclarationDto.prototype, "publicVenueOnly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SaveDeclarationDto.prototype, "professionalConduct", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SaveDeclarationDto.prototype, "noPrivateContact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SaveDeclarationDto.prototype, "safetyPolicy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SaveDeclarationDto.prototype, "noMisrepresentation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2023-01-01T00:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveDeclarationDto.prototype, "agreedAt", void 0);
class UpdateGovernmentIdTypeDto {
}
exports.UpdateGovernmentIdTypeDto = UpdateGovernmentIdTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Aadhaar Card' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGovernmentIdTypeDto.prototype, "documentType", void 0);
class SubmitGovernmentIdDto {
}
exports.SubmitGovernmentIdDto = SubmitGovernmentIdDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Aadhaar Card' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitGovernmentIdDto.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://bucket.s3.amazonaws.com/front.jpg' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitGovernmentIdDto.prototype, "frontUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://bucket.s3.amazonaws.com/back.jpg' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitGovernmentIdDto.prototype, "backUrl", void 0);
class SubmitSelfieDto {
}
exports.SubmitSelfieDto = SubmitSelfieDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://bucket.s3.amazonaws.com/selfie.jpg' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitSelfieDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://bucket.s3.amazonaws.com/liveness.mp4' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitSelfieDto.prototype, "videoUrl", void 0);
//# sourceMappingURL=kyc.dto.js.map