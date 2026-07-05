import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async getAccountSettings(companionId: string) {
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
    });
    if (!companion) throw new NotFoundException('Companion not found');

    return {
      companionId: companion.id,
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      language: 'en',
      currency: 'INR',
    };
  }

  async updateAccountSettings(companionId: string, settings: any) {
    // In actual implementation, update DB table. Using mock approach for scaffold.
    return { ...settings, companionId, message: 'Settings updated' };
  }

  async deleteAccount(companionId: string, reason?: string) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: {
        accountStatus: 'DELETED',
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
    return { message: 'Account scheduled for deletion. We are sorry to see you go.' };
  }
}
