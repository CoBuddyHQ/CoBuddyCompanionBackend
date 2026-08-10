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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const uploads_service_1 = require("./uploads.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
const multer_1 = require("multer");
const profile_service_1 = require("../profile/profile.service");
const upload = (0, multer_1.memoryStorage)();
let UploadsController = class UploadsController {
    constructor(uploadsService, profileService) {
        this.uploadsService = uploadsService;
        this.profileService = profileService;
    }
    async uploadProfilePhoto(c, file) {
        const result = await this.uploadsService.uploadFile(c.sub, file, 'profile_photo');
        const profileResponse = await this.profileService.updatePhoto(c.sub, { photoUrl: result.url });
        return { photoUrl: result.url, profile: profileResponse, onboardingStatus: profileResponse.onboardingStatus, message: 'Profile photo updated successfully' };
    }
    async uploadGalleryPhoto(c, file) {
        const result = await this.uploadsService.uploadFile(c.sub, file, 'gallery');
        return this.uploadsService.addGalleryPhoto(c.sub, result.url);
    }
    deleteGalleryPhoto(c, photoId) {
        return this.uploadsService.deleteGalleryPhoto(c.sub, photoId);
    }
    async uploadKycIdentity(c, file) {
        return this.uploadsService.uploadFile(c.sub, file, 'kyc_identity');
    }
    async uploadKycSelfie(c, file) {
        return this.uploadsService.uploadFile(c.sub, file, 'kyc_selfie');
    }
    async uploadKycAddress(c, file) {
        return this.uploadsService.uploadFile(c.sub, file, 'kyc_address');
    }
    async uploadKycPolice(c, file) {
        return this.uploadsService.uploadFile(c.sub, file, 'kyc_police');
    }
    async uploadEvidence(c, file) {
        return this.uploadsService.uploadFile(c.sub, file, 'evidence');
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)('profile-photo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', { storage: upload })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload profile photo — Endpoints.UPLOADS.PROFILE_PHOTO' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } } }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadProfilePhoto", null);
__decorate([
    (0, common_1.Post)('gallery'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', { storage: upload })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload gallery photo — Endpoints.UPLOADS.GALLERY_PHOTO' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } } }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadGalleryPhoto", null);
__decorate([
    (0, common_1.Delete)('gallery/:photoId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete gallery photo — Endpoints.UPLOADS.DELETE_PHOTO' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('photoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "deleteGalleryPhoto", null);
__decorate([
    (0, common_1.Post)('kyc/identity'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document', { storage: upload })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload KYC identity document' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadKycIdentity", null);
__decorate([
    (0, common_1.Post)('kyc/selfie'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('video', { storage: upload })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload KYC selfie video' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadKycSelfie", null);
__decorate([
    (0, common_1.Post)('kyc/address'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document', { storage: upload })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload KYC address document' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadKycAddress", null);
__decorate([
    (0, common_1.Post)('kyc/police'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document', { storage: upload })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload police verification certificate' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadKycPolice", null);
__decorate([
    (0, common_1.Post)('evidence'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: upload })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload incident/dispute evidence file' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadEvidence", null);
exports.UploadsController = UploadsController = __decorate([
    (0, swagger_1.ApiTags)('Uploads'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/uploads'),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService,
        profile_service_1.ProfileService])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map