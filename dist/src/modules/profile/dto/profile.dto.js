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
exports.ToggleAvailabilityDto = exports.ReorderPhotosDto = exports.UpdatePhotosDto = exports.UpdatePhotoDto = exports.UpdateBoundariesDto = exports.UpdateVenuesDto = exports.UpdateCommActivityDto = exports.UpdatePricingDto = exports.UpdateServiceAreasDto = exports.UpdateWorkPreferenceDto = exports.UpdateLanguagesDto = exports.UpdateCategoriesDto = exports.UpdateBioDto = exports.UpdateBasicProfileDto = exports.ProfileSetupBulkDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class ProfileSetupBulkDto {
}
exports.ProfileSetupBulkDto = ProfileSetupBulkDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'I love meaningful conversations...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProfileSetupBulkDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true, example: ['great_listener', 'art_lover'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProfileSetupBulkDto.prototype, "interestTags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true, example: ['cafe_conversation', 'city_walk'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProfileSetupBulkDto.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ProfileSetupBulkDto.prototype, "languages", void 0);
class UpdateBasicProfileDto {
}
exports.UpdateBasicProfileDto = UpdateBasicProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Priya' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBasicProfileDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Food Explorer' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBasicProfileDto.prototype, "tagline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Female' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBasicProfileDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'I love showing people around...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBasicProfileDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bhopal' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBasicProfileDto.prototype, "city", void 0);
class UpdateBioDto {
}
exports.UpdateBioDto = UpdateBioDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Passionate about meaningful conversations...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBioDto.prototype, "bio", void 0);
class UpdateCategoriesDto {
}
exports.UpdateCategoriesDto = UpdateCategoriesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true, example: ['cafe_conversation', 'city_walk'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateCategoriesDto.prototype, "categories", void 0);
class UpdateLanguagesDto {
}
exports.UpdateLanguagesDto = UpdateLanguagesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateLanguagesDto.prototype, "languages", void 0);
class UpdateWorkPreferenceDto {
}
exports.UpdateWorkPreferenceDto = UpdateWorkPreferenceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateWorkPreferenceDto.prototype, "durations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateWorkPreferenceDto.prototype, "days", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateWorkPreferenceDto.prototype, "timeRanges", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkPreferenceDto.prototype, "frequency", void 0);
class UpdateServiceAreasDto {
}
exports.UpdateServiceAreasDto = UpdateServiceAreasDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateServiceAreasDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateServiceAreasDto.prototype, "broadAreas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateServiceAreasDto.prototype, "willingToTravel", void 0);
class UpdatePricingDto {
}
exports.UpdatePricingDto = UpdatePricingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 699 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(99999),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "hourlyRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 90 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(30),
    (0, class_validator_1.Max)(300),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "sessionDuration", void 0);
class UpdateCommActivityDto {
}
exports.UpdateCommActivityDto = UpdateCommActivityDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCommActivityDto.prototype, "commStyle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCommActivityDto.prototype, "activityPace", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCommActivityDto.prototype, "groupPreference", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCommActivityDto.prototype, "accessibilityNote", void 0);
class UpdateVenuesDto {
}
exports.UpdateVenuesDto = UpdateVenuesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateVenuesDto.prototype, "venuePreferences", void 0);
class UpdateBoundariesDto {
}
exports.UpdateBoundariesDto = UpdateBoundariesDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateBoundariesDto.prototype, "boundariesAccepted", void 0);
class UpdatePhotoDto {
}
exports.UpdatePhotoDto = UpdatePhotoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePhotoDto.prototype, "photoUrl", void 0);
class UpdatePhotosDto {
}
exports.UpdatePhotosDto = UpdatePhotosDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePhotosDto.prototype, "photoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePhotosDto.prototype, "galleryPhotos", void 0);
class ReorderPhotosDto {
}
exports.ReorderPhotosDto = ReorderPhotosDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(9),
    __metadata("design:type", Array)
], ReorderPhotosDto.prototype, "photoIds", void 0);
class ToggleAvailabilityDto {
}
exports.ToggleAvailabilityDto = ToggleAvailabilityDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ToggleAvailabilityDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ToggleAvailabilityDto.prototype, "isOnline", void 0);
//# sourceMappingURL=profile.dto.js.map