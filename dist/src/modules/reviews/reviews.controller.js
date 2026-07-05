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
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reviews_service_1 = require("./reviews.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
let ReviewsController = class ReviewsController {
    constructor(reviewsService) {
        this.reviewsService = reviewsService;
    }
    getReviews(c, page = 1) {
        return this.reviewsService.getReviews(c.sub, Number(page));
    }
    getReview(c, id) {
        return this.reviewsService.getReview(c.sub, id);
    }
    getTrustScore(c) {
        return this.reviewsService.getTrustScore(c.sub);
    }
    getTrustTasks(c) {
        return this.reviewsService.getTrustTasks(c.sub);
    }
    getBadges(c) {
        return this.reviewsService.getBadges(c.sub);
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, common_1.Get)('reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all reviews — Endpoints.REVIEWS.LIST' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Get)('reviews/:reviewId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get review detail — Endpoints.REVIEWS.DETAIL' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('reviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "getReview", null);
__decorate([
    (0, common_1.Get)('trust/score'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trust score — Endpoints.REVIEWS.TRUST_SCORE' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "getTrustScore", null);
__decorate([
    (0, common_1.Get)('trust/tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trust improvement tasks — Endpoints.REVIEWS.TRUST_TASKS' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "getTrustTasks", null);
__decorate([
    (0, common_1.Get)('trust/badges'),
    (0, swagger_1.ApiOperation)({ summary: 'Get earned badges — Endpoints.REVIEWS.BADGES' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "getBadges", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Reviews'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion'),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], ReviewsController);
//# sourceMappingURL=reviews.controller.js.map