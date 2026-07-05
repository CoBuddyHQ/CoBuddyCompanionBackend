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
exports.LogoutDto = exports.BiometricEnrollDto = exports.RefreshTokenDto = exports.VerifyPinDto = exports.SetPinDto = exports.VerifyOtpDto = exports.SendOtpDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SendOtpDto {
}
exports.SendOtpDto = SendOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210', description: 'Phone number with country code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\+[1-9]\d{9,14}$/, { message: 'Invalid phone number format' }),
    __metadata("design:type", String)
], SendOtpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'device-uuid-123' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendOtpDto.prototype, "deviceId", void 0);
class VerifyOtpDto {
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsNumberString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "otp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'device-uuid-123' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'iPhone 15 Pro' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "deviceName", void 0);
class SetPinDto {
}
exports.SetPinDto = SetPinDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1234' }),
    (0, class_validator_1.IsNumberString)(),
    (0, class_validator_1.Length)(4, 6),
    __metadata("design:type", String)
], SetPinDto.prototype, "pin", void 0);
class VerifyPinDto {
}
exports.VerifyPinDto = VerifyPinDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1234' }),
    (0, class_validator_1.IsNumberString)(),
    (0, class_validator_1.Length)(4, 6),
    __metadata("design:type", String)
], VerifyPinDto.prototype, "pin", void 0);
class RefreshTokenDto {
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
class BiometricEnrollDto {
}
exports.BiometricEnrollDto = BiometricEnrollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'device-uuid-123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BiometricEnrollDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Public key for biometric verification' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BiometricEnrollDto.prototype, "publicKey", void 0);
class LogoutDto {
}
exports.LogoutDto = LogoutDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogoutDto.prototype, "deviceId", void 0);
//# sourceMappingURL=auth.dto.js.map