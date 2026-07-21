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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const profile_service_1 = require("./profile.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
const profile_dto_1 = require("./dto/profile.dto");
let ProfileController = class ProfileController {
    constructor(profileService) {
        this.profileService = profileService;
    }
    updatePhoto(c, dto) {
        return this.profileService.updatePhoto(c.sub, dto);
    }
    updatePhotos(c, dto) {
        return this.profileService.updatePhotos(c.sub, dto);
    }
    updateWorkPreference(c, dto) {
        return this.profileService.updateWorkPreference(c.sub, dto);
    }
    updateCommActivity(c, dto) {
        return this.profileService.updateCommActivity(c.sub, dto);
    }
    updateVenues(c, dto) {
        return this.profileService.updateVenues(c.sub, dto);
    }
    updateBoundaries(c, dto) {
        return this.profileService.updateBoundaries(c.sub, dto);
    }
    setupBulk(c, dto) {
        return this.profileService.setupBulk(c.sub, dto);
    }
    getProfile(c) {
        return this.profileService.getProfile(c.sub);
    }
    updateBasic(c, dto) {
        return this.profileService.updateBasic(c.sub, dto);
    }
    updateBio(c, dto) {
        return this.profileService.updateBio(c.sub, dto);
    }
    updateCategories(c, dto) {
        return this.profileService.updateCategories(c.sub, dto);
    }
    updateLanguages(c, dto) {
        return this.profileService.updateLanguages(c.sub, dto);
    }
    updateServiceAreas(c, dto) {
        return this.profileService.updateServiceAreas(c.sub, dto);
    }
    updatePricing(c, dto) {
        return this.profileService.updatePricing(c.sub, dto);
    }
    reorderPhotos(c, dto) {
        return this.profileService.reorderPhotos(c.sub, dto);
    }
    toggleAvailability(c, dto) {
        return this.profileService.toggleAvailability(c.sub, dto);
    }
    submitForReview(c) {
        return this.profileService.submitForReview(c.sub);
    }
    getPreview(c) {
        return this.profileService.getPreview(c.sub);
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Put)('photo'),
    (0, swagger_1.ApiOperation)({ summary: 'Update primary profile photo' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdatePhotoDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updatePhoto", null);
__decorate([
    (0, common_1.Put)('photos'),
    (0, swagger_1.ApiOperation)({ summary: 'Update gallery photos and/or primary photo' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdatePhotosDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updatePhotos", null);
__decorate([
    (0, common_1.Put)('work-preference'),
    (0, swagger_1.ApiOperation)({ summary: 'Update work preference' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateWorkPreferenceDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateWorkPreference", null);
__decorate([
    (0, common_1.Put)('comm-activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Update communication and activity preferences' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateCommActivityDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateCommActivity", null);
__decorate([
    (0, common_1.Put)('venues'),
    (0, swagger_1.ApiOperation)({ summary: 'Update public venue preferences' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateVenuesDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateVenues", null);
__decorate([
    (0, common_1.Put)('boundaries'),
    (0, swagger_1.ApiOperation)({ summary: 'Update boundaries and safety acceptance' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateBoundariesDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateBoundaries", null);
__decorate([
    (0, common_1.Post)('setup-bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save bio, interests, categories, and languages in one bulk request' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.ProfileSetupBulkDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "setupBulk", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get companion profile (CompanionProfile interface)' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('basic'),
    (0, swagger_1.ApiOperation)({ summary: 'Update basic profile (name, city)' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateBasicProfileDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateBasic", null);
__decorate([
    (0, common_1.Put)('bio'),
    (0, swagger_1.ApiOperation)({ summary: 'Update companion bio' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateBioDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateBio", null);
__decorate([
    (0, common_1.Put)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Update experience categories' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateCategoriesDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateCategories", null);
__decorate([
    (0, common_1.Put)('languages'),
    (0, swagger_1.ApiOperation)({ summary: 'Update languages' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateLanguagesDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateLanguages", null);
__decorate([
    (0, common_1.Put)('service-areas'),
    (0, swagger_1.ApiOperation)({ summary: 'Update service areas' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateServiceAreasDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateServiceAreas", null);
__decorate([
    (0, common_1.Put)('pricing'),
    (0, swagger_1.ApiOperation)({ summary: 'Update hourly rate' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdatePricingDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updatePricing", null);
__decorate([
    (0, common_1.Put)('photos/reorder'),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder gallery photos' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.ReorderPhotosDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "reorderPhotos", null);
__decorate([
    (0, common_1.Put)('availability'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle online/available status' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.ToggleAvailabilityDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "toggleAvailability", null);
__decorate([
    (0, common_1.Post)('submit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Submit profile for admin review' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "submitForReview", null);
__decorate([
    (0, common_1.Get)('preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Preview public profile as customers see it' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "getPreview", null);
exports.ProfileController = ProfileController = __decorate([
    (0, swagger_1.ApiTags)('Profile'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/profile'),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map