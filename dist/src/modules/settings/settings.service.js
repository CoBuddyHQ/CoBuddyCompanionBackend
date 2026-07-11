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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBankDetails(companionId) {
        const kyc = await this.prisma.companionKYC.findUnique({
            where: { companionId },
            select: {
                bankHolderName: true,
                bankName: true,
                maskedBankAccount: true,
                bankIfsc: true,
                bankVerified: true,
            },
        });
        return kyc || {};
    }
    async updateBankDetails(companionId, dto) {
        const masked = `•••• ${dto.accountNo.slice(-4)}`;
        await this.prisma.companionKYC.upsert({
            where: { companionId },
            update: {
                bankHolderName: dto.holderName,
                maskedBankAccount: masked,
                bankIfsc: dto.ifsc,
                bankName: dto.bankName,
                bankVerified: false,
            },
            create: {
                companionId,
                bankHolderName: dto.holderName,
                maskedBankAccount: masked,
                bankIfsc: dto.ifsc,
                bankName: dto.bankName,
                bankVerified: false,
            },
        });
        return { success: true, message: 'Bank details updated. Pending verification.' };
    }
    async changePin(companionId, dto) {
        const companionPin = await this.prisma.companionPIN.findUnique({
            where: { companionId },
        });
        if (!companionPin) {
            await this.prisma.companionPIN.create({
                data: { companionId, pinHash: dto.newPin },
            });
            return { success: true, message: 'PIN created.' };
        }
        if (companionPin.pinHash !== dto.currentPin) {
            throw new common_1.BadRequestException('Current PIN is incorrect');
        }
        await this.prisma.companionPIN.update({
            where: { companionId },
            data: { pinHash: dto.newPin },
        });
        return { success: true, message: 'PIN changed successfully.' };
    }
    async onboardingSync(companionId, dto) {
        const data = {};
        if (dto.language !== undefined)
            data.language = dto.language;
        if (dto.locationEnabled !== undefined)
            data.locationEnabled = dto.locationEnabled;
        if (dto.notificationsEnabled !== undefined)
            data.notificationsEnabled = dto.notificationsEnabled;
        if (dto.termsAccepted !== undefined)
            data.termsAccepted = dto.termsAccepted;
        if (dto.safetyRulesAccepted !== undefined)
            data.safetyRulesAccepted = dto.safetyRulesAccepted;
        const settings = await this.prisma.companionSettings.upsert({
            where: { companionId },
            update: data,
            create: {
                companionId,
                ...data,
            },
        });
        return { success: true, settings };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map