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
exports.AvailabilityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const availability_service_1 = require("./availability.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
let AvailabilityController = class AvailabilityController {
    constructor(availabilityService) {
        this.availabilityService = availabilityService;
    }
    getSchedule(c) {
        return this.availabilityService.getSchedule(c.sub);
    }
    updateSchedule(c, dto) {
        return this.availabilityService.updateSchedule(c.sub, dto);
    }
    getHolidays(c) {
        return this.availabilityService.getHolidays(c.sub);
    }
    setHolidays(c, dto) {
        return this.availabilityService.setHolidays(c.sub, dto);
    }
};
exports.AvailabilityController = AvailabilityController;
__decorate([
    (0, common_1.Get)('schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Get regular schedule' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Put)('schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Update regular schedule' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "updateSchedule", null);
__decorate([
    (0, common_1.Get)('holidays'),
    (0, swagger_1.ApiOperation)({ summary: 'Get planned holidays' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getHolidays", null);
__decorate([
    (0, common_1.Put)('holidays'),
    (0, swagger_1.ApiOperation)({ summary: 'Update planned holidays' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "setHolidays", null);
exports.AvailabilityController = AvailabilityController = __decorate([
    (0, swagger_1.ApiTags)('Availability'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/availability'),
    __metadata("design:paramtypes", [availability_service_1.AvailabilityService])
], AvailabilityController);
//# sourceMappingURL=availability.controller.js.map