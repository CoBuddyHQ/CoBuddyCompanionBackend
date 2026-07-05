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
exports.AccountController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const account_service_1 = require("./account.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_companion_decorator_1 = require("../../common/decorators/current-companion.decorator");
let AccountController = class AccountController {
    constructor(accountService) {
        this.accountService = accountService;
    }
    getSettings(c) {
        return this.accountService.getAccountSettings(c.sub);
    }
    updateSettings(c, dto) {
        return this.accountService.updateAccountSettings(c.sub, dto);
    }
    deleteAccount(c, dto) {
        return this.accountService.deleteAccount(c.sub, dto?.reason);
    }
};
exports.AccountController = AccountController;
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get account settings' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update account settings' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AccountController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Delete)('delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete account' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AccountController.prototype, "deleteAccount", null);
exports.AccountController = AccountController = __decorate([
    (0, swagger_1.ApiTags)('Account'),
    (0, swagger_1.ApiBearerAuth)('companion-jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('companion/account'),
    __metadata("design:paramtypes", [account_service_1.AccountService])
], AccountController);
//# sourceMappingURL=account.controller.js.map