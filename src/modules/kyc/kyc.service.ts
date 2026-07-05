import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async getKycStatus(companionId: string) {
    let kyc = await this.prisma.companionKYC.findUnique({
      where: { companionId },
    });
    if (!kyc) {
      kyc = await this.prisma.companionKYC.create({ data: { companionId } });
    }

    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      select: { verificationStatus: true },
    });

    return {
      kycId: kyc.id,
      overallStatus: companion?.verificationStatus?.toLowerCase() || 'unverified',
      identityDocumentType: kyc.identityDocumentType,
      identityDocumentStatus: this.getDocStatus(kyc, 'identity'),
      selfieStatus: this.getDocStatus(kyc, 'selfie'),
      addressDocumentStatus: this.getDocStatus(kyc, 'address'),
      policeVerificationStatus: this.getDocStatus(kyc, 'police'),
      rejectionReason: kyc.rejectionReason,
      submittedAt: kyc.submittedAt?.toISOString(),
      approvedAt: kyc.approvedAt?.toISOString(),
    };
  }

  async uploadIdentity(companionId: string, dto: any) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { identityDocumentType: dto.documentType, identityDocumentUrl: dto.documentUrl },
      create: { companionId, identityDocumentType: dto.documentType, identityDocumentUrl: dto.documentUrl },
    });
    return { message: 'Identity document uploaded' };
  }

  async uploadSelfie(companionId: string, dto: any) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { selfieVideoUrl: dto.videoUrl },
      create: { companionId, selfieVideoUrl: dto.videoUrl },
    });
    return { message: 'Selfie video uploaded' };
  }

  async uploadAddress(companionId: string, dto: any) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { addressDocumentUrl: dto.documentUrl },
      create: { companionId, addressDocumentUrl: dto.documentUrl },
    });
    return { message: 'Address document uploaded' };
  }

  async uploadPolice(companionId: string, dto: any) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { policeVerificationUrl: dto.documentUrl },
      create: { companionId, policeVerificationUrl: dto.documentUrl },
    });
    return { message: 'Police verification document uploaded' };
  }

  private getDocStatus(kyc: any, type: string): string {
    if (kyc.approvedAt) return 'approved';
    if (kyc.rejectionReason) return 'rejected';
    if (kyc.submittedAt) return 'pending';
    
    switch (type) {
      case 'identity': return kyc.identityDocumentUrl ? 'uploaded' : 'missing';
      case 'selfie': return kyc.selfieVideoUrl ? 'uploaded' : 'missing';
      case 'address': return kyc.addressDocumentUrl ? 'uploaded' : 'missing';
      case 'police': return kyc.policeVerificationUrl ? 'uploaded' : 'missing';
      default: return 'missing';
    }
  }
}
