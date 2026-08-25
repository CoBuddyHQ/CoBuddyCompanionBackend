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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
let AppController = class AppController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getHealth(res) {
        let dbStatus = 'disconnected';
        let isHealthy = false;
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            dbStatus = 'connected';
            isHealthy = true;
        }
        catch (err) {
            dbStatus = `error: ${err.message || 'database unreachable'}`;
        }
        const responsePayload = {
            status: isHealthy ? 'ok' : 'unhealthy',
            database: dbStatus,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            service: 'cobuddy-companion-backend',
        };
        return res
            .status(isHealthy ? common_1.HttpStatus.OK : common_1.HttpStatus.SERVICE_UNAVAILABLE)
            .json(responsePayload);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHealth", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map