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
exports.TrainingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const training_service_1 = require("./training.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
let TrainingController = class TrainingController {
    constructor(trainingService) {
        this.trainingService = trainingService;
    }
    getModules(c) {
        return this.trainingService.getModules(c.sub);
    }
    getModule(moduleId) {
        return this.trainingService.getModule(moduleId);
    }
    completeModule(c, moduleId, dto) {
        return this.trainingService.completeModule(c.sub, moduleId, dto?.score);
    }
};
exports.TrainingController = TrainingController;
__decorate([
    (0, common_1.Get)('modules'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all training modules with completion status' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "getModules", null);
__decorate([
    (0, common_1.Get)('modules/:moduleId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get training module content' }),
    __param(0, (0, common_1.Param)('moduleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "getModule", null);
__decorate([
    (0, common_1.Post)('modules/:moduleId/complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark training module as completed' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('moduleId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "completeModule", null);
exports.TrainingController = TrainingController = __decorate([
    (0, swagger_1.ApiTags)('Training'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/training'),
    __metadata("design:paramtypes", [training_service_1.TrainingService])
], TrainingController);
//# sourceMappingURL=training.controller.js.map