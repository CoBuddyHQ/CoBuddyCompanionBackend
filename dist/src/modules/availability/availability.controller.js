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
    getAvailability(c) {
        return this.availabilityService.getAvailability(c.sub);
    }
    setLiveAvailable(c, isAvailable) {
        return this.availabilityService.setLiveAvailable(c.sub, isAvailable);
    }
    setVacationMode(c, dto) {
        return this.availabilityService.setVacationMode(c.sub, dto);
    }
    toggleDay(c, day) {
        return this.availabilityService.toggleDay(c.sub, day);
    }
    setDayTimes(c, day, dto) {
        const times = dto.times ?? (dto.startTime && dto.endTime ? `${dto.startTime} - ${dto.endTime}` : '09:00 AM - 06:00 PM');
        return this.availabilityService.setDayTimes(c.sub, day, times);
    }
    addOverride(c, dto) {
        return this.availabilityService.addOverride(c.sub, dto);
    }
    removeOverride(c, id) {
        return this.availabilityService.removeOverride(c.sub, id);
    }
    addSlot(c, dto) {
        return this.availabilityService.addSlot(c.sub, dto);
    }
    updateSlot(c, id, dto) {
        return this.availabilityService.updateSlot(c.sub, id, dto);
    }
    removeSlot(c, id) {
        return this.availabilityService.removeSlot(c.sub, id);
    }
};
exports.AvailabilityController = AvailabilityController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get full availability state' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Put)('live'),
    (0, swagger_1.ApiOperation)({ summary: 'Set live availability' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)('isAvailable')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Boolean]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "setLiveAvailable", null);
__decorate([
    (0, common_1.Put)('vacation'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable or disable vacation mode' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "setVacationMode", null);
__decorate([
    (0, common_1.Put)('weekly/:day/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle day active status' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('day')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "toggleDay", null);
__decorate([
    (0, common_1.Put)('weekly/:day/times'),
    (0, swagger_1.ApiOperation)({ summary: 'Set day times' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('day')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "setDayTimes", null);
__decorate([
    (0, common_1.Post)('overrides'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a date override' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "addOverride", null);
__decorate([
    (0, common_1.Delete)('overrides/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a date override' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "removeOverride", null);
__decorate([
    (0, common_1.Post)('slots'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a custom slot' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "addSlot", null);
__decorate([
    (0, common_1.Put)('slots/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a custom slot' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "updateSlot", null);
__decorate([
    (0, common_1.Delete)('slots/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a custom slot' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "removeSlot", null);
exports.AvailabilityController = AvailabilityController = __decorate([
    (0, swagger_1.ApiTags)('Availability'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/availability'),
    __metadata("design:paramtypes", [availability_service_1.AvailabilityService])
], AvailabilityController);
//# sourceMappingURL=availability.controller.js.map