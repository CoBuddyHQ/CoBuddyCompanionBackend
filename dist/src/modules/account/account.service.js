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
exports.AccountService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AccountService = class AccountService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAccountSettings(companionId) {
        const companion = await this.prisma.companion.findUnique({
            where: { id: companionId },
        });
        if (!companion)
            throw new common_1.NotFoundException('Companion not found');
        return {
            companionId: companion.id,
            pushNotifications: true,
            emailNotifications: true,
            smsNotifications: false,
            language: 'en',
            currency: 'INR',
        };
    }
    async updateAccountSettings(companionId, settings) {
        return { ...settings, companionId, message: 'Settings updated' };
    }
    async deleteAccount(companionId, reason) {
        await this.prisma.companion.update({
            where: { id: companionId },
            data: {
                accountStatus: 'DELETED',
                deletedAt: new Date(),
                isAvailable: false,
                isOnline: false,
            },
        });
        await this.prisma.refreshToken.updateMany({
            where: { companionId },
            data: { isRevoked: true },
        });
        return { message: 'Account scheduled for deletion. We are sorry to see you go.' };
    }
};
exports.AccountService = AccountService;
exports.AccountService = AccountService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountService);
//# sourceMappingURL=account.service.js.map