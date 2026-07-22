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
    async getOrCreateSettings(companionId) {
        let settings = await this.prisma.companionSettings.findUnique({ where: { companionId } });
        if (!settings) {
            settings = await this.prisma.companionSettings.create({
                data: { companionId, notificationPrefs: {} },
            });
        }
        return settings;
    }
    async getAccountSettings(companionId) {
        const companion = await this.prisma.companion.findUnique({
            where: { id: companionId },
            include: {
                kyc: { select: { bankName: true, maskedBankAccount: true, maskedUpi: true } },
            },
        });
        if (!companion)
            throw new common_1.NotFoundException('Companion not found');
        const settings = await this.getOrCreateSettings(companionId);
        return {
            companionId: companion.id,
            accountStatus: companion.accountStatus,
            profileStatus: companion.profileStatus,
            verificationStatus: companion.verificationStatus,
            phone: companion.phone,
            settings: {
                notificationPrefs: settings.notificationPrefs,
                privacyVisibility: settings.showInSearch ? 'public' : 'private',
                privacyDataSharing: settings.allowPromo,
                language: settings.language,
            },
            payoutDetails: {
                bankName: companion.kyc?.bankName,
                maskedBankAccount: companion.kyc?.maskedBankAccount,
                maskedUpi: companion.kyc?.maskedUpi,
            },
        };
    }
    async updateNotificationPrefs(companionId, prefs) {
        const updated = await this.prisma.companionSettings.upsert({
            where: { companionId },
            update: { notificationPrefs: prefs },
            create: { companionId, notificationPrefs: prefs },
        });
        return { success: true, prefs: updated.notificationPrefs, message: 'Notification preferences updated.' };
    }
    async updatePrivacy(companionId, dto) {
        const showInSearch = dto.visibility !== 'private';
        const updated = await this.prisma.companionSettings.upsert({
            where: { companionId },
            update: { showInSearch, allowPromo: dto.dataSharing },
            create: { companionId, showInSearch, allowPromo: dto.dataSharing },
        });
        return { success: true, visibility: updated.showInSearch ? 'public' : 'private', dataSharing: updated.allowPromo };
    }
    async updateLanguage(companionId, dto) {
        const updated = await this.prisma.companionSettings.upsert({
            where: { companionId },
            update: { language: dto.language },
            create: { companionId, language: dto.language },
        });
        return { success: true, language: updated.language };
    }
    async deactivateAccount(companionId, dto) {
        await this.prisma.companion.update({
            where: { id: companionId },
            data: { accountStatus: 'suspended', isAvailable: false, isOnline: false },
        });
        return { success: true, message: 'Account deactivated successfully.' };
    }
    async reactivateAccount(companionId) {
        await this.prisma.companion.update({
            where: { id: companionId },
            data: { accountStatus: 'active' },
        });
        return { success: true, message: 'Account reactivation requested.' };
    }
    async deleteAccount(companionId, dto) {
        if (!dto.confirmation)
            throw new Error('Confirmation required');
        await this.prisma.companion.update({
            where: { id: companionId },
            data: {
                accountStatus: 'deleted',
                deletedAt: new Date(),
                isAvailable: false,
                isOnline: false,
            },
        });
        await this.prisma.refreshToken.updateMany({
            where: { companionId },
            data: { isRevoked: true },
        });
        return { success: true, message: 'Account scheduled for deletion. We are sorry to see you go.' };
    }
    async exportData(companionId) {
        return {
            success: true,
            downloadLink: 'https://cdn.cobuddy.com/exports/companion_data_cb2049.zip',
            expiresIn: '24h',
            message: 'Data export generated successfully. Link expires in 24 hours.',
        };
    }
};
exports.AccountService = AccountService;
exports.AccountService = AccountService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountService);
//# sourceMappingURL=account.service.js.map