import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateSettings(companionId: string) {
    let settings = await this.prisma.companionSettings.findUnique({ where: { companionId } });
    if (!settings) {
      settings = await this.prisma.companionSettings.create({
        data: { companionId, notificationPrefs: {} },
      });
    }
    return settings;
  }

  // ─── GET /companion/account/settings ───────────────────────────────────────
  async getAccountSettings(companionId: string) {
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      include: {
        kyc: { select: { bankName: true, maskedBankAccount: true, maskedUpi: true } },
      },
    });
    if (!companion) throw new NotFoundException('Companion not found');
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

  // ─── PUT /companion/account/notification-preferences ───────────────────────
  async updateNotificationPrefs(companionId: string, prefs: any) {
    const updated = await this.prisma.companionSettings.upsert({
      where: { companionId },
      update: { notificationPrefs: prefs },
      create: { companionId, notificationPrefs: prefs },
    });
    return { success: true, prefs: updated.notificationPrefs, message: 'Notification preferences updated.' };
  }

  // ─── PUT /companion/account/privacy ────────────────────────────────────────
  async updatePrivacy(companionId: string, dto: { visibility: string; dataSharing: boolean }) {
    const showInSearch = dto.visibility !== 'private';
    const updated = await this.prisma.companionSettings.upsert({
      where: { companionId },
      update: { showInSearch, allowPromo: dto.dataSharing },
      create: { companionId, showInSearch, allowPromo: dto.dataSharing },
    });
    return { success: true, visibility: updated.showInSearch ? 'public' : 'private', dataSharing: updated.allowPromo };
  }

  // ─── PUT /companion/account/language ───────────────────────────────────────
  async updateLanguage(companionId: string, dto: { language: string }) {
    const updated = await this.prisma.companionSettings.upsert({
      where: { companionId },
      update: { language: dto.language },
      create: { companionId, language: dto.language },
    });
    return { success: true, language: updated.language };
  }

  // ─── POST /companion/account/deactivate ────────────────────────────────────
  async deactivateAccount(companionId: string, dto: { reason?: string }) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { accountStatus: 'suspended', isAvailable: false, isOnline: false },
    });
    return { success: true, message: 'Account deactivated successfully.' };
  }

  // ─── POST /companion/account/reactivate ────────────────────────────────────
  async reactivateAccount(companionId: string) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { accountStatus: 'active' },
    });
    return { success: true, message: 'Account reactivation requested.' };
  }

  // ─── DELETE /companion/account/delete ──────────────────────────────────────
  async deleteAccount(companionId: string, dto: { reason?: string; confirmation: boolean }) {
    if (!dto.confirmation) throw new Error('Confirmation required');
    await this.prisma.companion.update({
      where: { id: companionId },
      data: {
        accountStatus: 'deleted',
        deletedAt: new Date(),
        isAvailable: false,
        isOnline: false,
      },
    });
    // Revoke all tokens
    await this.prisma.refreshToken.updateMany({
      where: { companionId },
      data: { isRevoked: true },
    });
    return { success: true, message: 'Account scheduled for deletion. We are sorry to see you go.' };
  }

  // ─── GET /companion/account/data-export ────────────────────────────────────
  async exportData(companionId: string) {
    // In production, this would trigger an async job and email a link.
    // For now, return a mock download link.
    return {
      success: true,
      downloadLink: 'https://cdn.cobuddy.com/exports/companion_data_cb2049.zip',
      expiresIn: '24h',
      message: 'Data export generated successfully. Link expires in 24 hours.',
    };
  }
}
