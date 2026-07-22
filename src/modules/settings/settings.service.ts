import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardingSyncDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // ─── GET /companion/settings/bank ──────────────────────────────────────────
  async getBankDetails(companionId: string) {
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

  // ─── POST /companion/settings/bank ─────────────────────────────────────────
  async updateBankDetails(companionId: string, dto: { holderName: string; accountNo: string; ifscCode: string; bankName: string }) {
    const masked = `•••• ${dto.accountNo.slice(-4)}`;
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        bankHolderName: dto.holderName,
        maskedBankAccount: masked,
        bankIfsc: dto.ifscCode,
        bankName: dto.bankName,
        bankVerified: false,
      },
      create: {
        companionId,
        bankHolderName: dto.holderName,
        maskedBankAccount: masked,
        bankIfsc: dto.ifscCode,
        bankName: dto.bankName,
        bankVerified: false,
      },
    });
    return { success: true, message: 'Bank details updated. Pending verification.' };
  }

  // ─── POST /companion/settings/pin/change ───────────────────────────────────
  async changePin(companionId: string, dto: { currentPin: string; newPin: string }) {
    const companionPin = await this.prisma.companionPIN.findUnique({
      where: { companionId },
    });
    if (!companionPin) {
      // If they don't have a PIN yet, just create it
      await this.prisma.companionPIN.create({
        data: { companionId, pinHash: dto.newPin }, // should hash in prod
      });
      return { success: true, message: 'PIN created.' };
    }
    
    // Validate current (mock validation)
    if (companionPin.pinHash !== dto.currentPin) {
      throw new BadRequestException('Current PIN is incorrect');
    }

    await this.prisma.companionPIN.update({
      where: { companionId },
      data: { pinHash: dto.newPin }, // should hash
    });

    return { success: true, message: 'PIN changed successfully.' };
  }

  // ─── POST /companion/settings/onboarding-sync ────────────────────────────
  async onboardingSync(companionId: string, dto: OnboardingSyncDto) {
    const data: any = {};
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.locationEnabled !== undefined) data.locationEnabled = dto.locationEnabled;
    if (dto.notificationsEnabled !== undefined) data.notificationsEnabled = dto.notificationsEnabled;
    if (dto.termsAccepted !== undefined) data.termsAccepted = dto.termsAccepted;
    if (dto.safetyRulesAccepted !== undefined) data.safetyRulesAccepted = dto.safetyRulesAccepted;

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

  // ─── GET & POST /companion/settings/privacy ──────────────────────────────
  async getPrivacyControls(companionId: string) {
    const settings = await this.prisma.companionSettings.findUnique({
      where: { companionId },
      select: { showAge: true, allowPromo: true, showInSearch: true },
    });
    return settings || { showAge: true, allowPromo: false, showInSearch: true };
  }

  async updatePrivacyControls(companionId: string, dto: any) {
    const settings = await this.prisma.companionSettings.upsert({
      where: { companionId },
      update: dto,
      create: { companionId, ...dto },
    });
    return { success: true, settings };
  }

  // ─── GET & POST /companion/settings/notifications ────────────────────────
  async getNotificationPrefs(companionId: string) {
    const settings = await this.prisma.companionSettings.findUnique({
      where: { companionId },
      select: { notificationPrefs: true },
    });
    return settings?.notificationPrefs || {};
  }

  async updateNotificationPrefs(companionId: string, dto: any) {
    const existing = await this.getNotificationPrefs(companionId);
    const updatedPrefs = { ...((existing as any) || {}), ...dto };

    const settings = await this.prisma.companionSettings.upsert({
      where: { companionId },
      update: { notificationPrefs: updatedPrefs },
      create: { companionId, notificationPrefs: updatedPrefs },
    });
    return { success: true, settings };
  }

  // ─── POST /companion/settings/data-export ────────────────────────────────
  async requestDataExport(companionId: string) {
    // In a real system, this would trigger an async job to collect data (chats, earnings, etc.)
    // and email it to the user.
    return { 
      success: true, 
      message: 'Data export requested. We will email you a secure download link shortly.' 
    };
  }

  // ─── POST /companion/settings/account/delete ─────────────────────────────
  async deleteAccount(companionId: string) {
    // In a real system, we might soft-delete or anonymize data based on compliance.
    // For this scaffold, we will actually delete the Companion record which cascades.
    await this.prisma.companion.delete({
      where: { id: companionId },
    });

    return { 
      success: true, 
      message: 'Your account has been permanently deleted.' 
    };
  }
}
