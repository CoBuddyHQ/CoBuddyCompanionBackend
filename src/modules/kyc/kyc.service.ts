import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BasicDetailsDto } from './dto/kyc.dto';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  // ─── GET /companion/kyc/status ───────────────────────────────────────────────
  // Matches VerificationHubScreen — returns full KYC status
  async getKycStatus(companionId: string) {
    let kyc = await this.prisma.companionKYC.findUnique({ where: { companionId } });
    if (!kyc) {
      kyc = await this.prisma.companionKYC.create({ data: { companionId } });
    }
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      select: { verificationStatus: true, profileStatus: true },
    });

    return {
      kycId: kyc.id,
      overallStatus: companion?.verificationStatus?.toLowerCase() ?? 'unverified',
      profileStatus: companion?.profileStatus?.toLowerCase() ?? 'incomplete',
      steps: {
        identity: {
          status: kyc.identityDocumentUrl ? 'submitted' : 'pending',
          documentType: kyc.identityDocumentType ?? null,
          submittedAt: kyc.identitySubmittedAt?.toISOString() ?? null,
        },
        selfie: {
          status: kyc.selfieVideoUrl ? 'submitted' : 'pending',
          submittedAt: kyc.selfieSubmittedAt?.toISOString() ?? null,
        },
        address: {
          status: kyc.addressDocumentUrl ? 'submitted' : 'pending',
          documentType: kyc.addressDocumentType ?? null,
          submittedAt: kyc.addressSubmittedAt?.toISOString() ?? null,
        },
        pan: {
          status: kyc.maskedPan ? 'submitted' : 'pending',
          maskedPan: kyc.maskedPan ?? null,
        },
        bank: {
          status: kyc.maskedBankAccount ? 'submitted' : 'pending',
          maskedAccount: kyc.maskedBankAccount ?? null,
          bankName: kyc.bankName ?? null,
        },
        upi: {
          status: kyc.maskedUpi ? 'submitted' : 'pending',
          maskedUpi: kyc.maskedUpi ?? null,
        },
        emergencyContact: {
          status: kyc.emergencyContactName ? 'submitted' : 'pending',
          name: kyc.emergencyContactName ?? null,
        },
        declaration: {
          status: kyc.declarationAgreedAt ? 'submitted' : 'pending',
          agreedAt: kyc.declarationAgreedAt?.toISOString() ?? null,
        },
      },
      rejectionReason: kyc.rejectionReason ?? null,
      submittedAt: kyc.submittedAt?.toISOString() ?? null,
      approvedAt: kyc.approvedAt?.toISOString() ?? null,
    };
  }

  // ─── POST /companion/kyc/basic-details ─────────────────────────────────────
  async saveBasicDetails(companionId: string, dto: BasicDetailsDto) {
    // 1. Update core Companion record (email, dob, gender, display name)
    const companionData: any = {};
    if (dto.email !== undefined) companionData.email = dto.email;
    if (dto.dateOfBirth !== undefined) companionData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender !== undefined) companionData.gender = dto.gender;
    if (dto.displayName !== undefined) companionData.displayName = dto.displayName;

    if (Object.keys(companionData).length > 0) {
      await this.prisma.companion.update({
        where: { id: companionId },
        data: companionData,
      });
    }

    // 2. Update KYC record (legal names)
    const kycData: any = {};
    if (dto.legalFirstName !== undefined) kycData.legalFirstName = dto.legalFirstName;
    if (dto.legalLastName !== undefined) kycData.legalLastName = dto.legalLastName;

    if (Object.keys(kycData).length > 0) {
      await this.prisma.companionKYC.upsert({
        where: { companionId },
        update: kycData,
        create: {
          companionId,
          ...kycData,
        },
      });
    }

    return { success: true, message: 'Basic details saved successfully' };
  }

  // ─── POST /companion/application/draft ───────────────────────────────────────
  // ApplicationSavedDraftScreen — saves application progress
  async saveDraft(companionId: string, dto: { stage: string; data?: any }) {
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { profileStatus: 'INCOMPLETE' },
    });
    // Store draft stage in KYC table for now
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { draftStage: dto.stage, draftData: dto.data ? JSON.stringify(dto.data) : null },
      create: { companionId, draftStage: dto.stage },
    });
    return {
      success: true,
      savedAt: new Date().toISOString(),
      stage: dto.stage,
      message: 'Progress saved. You can resume from where you left off.',
    };
  }

  // ─── POST /companion/kyc/government-id ───────────────────────────────────────
  // GovernmentIDUploadScreen — uploads ID docs
  async submitGovernmentId(companionId: string, dto: { documentType: string; frontUrl: string; backUrl?: string }) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        identityDocumentType: dto.documentType,
        identityDocumentUrl: dto.frontUrl,
        identityDocumentBackUrl: dto.backUrl ?? null,
        identitySubmittedAt: new Date(),
      },
      create: {
        companionId,
        identityDocumentType: dto.documentType,
        identityDocumentUrl: dto.frontUrl,
        identityDocumentBackUrl: dto.backUrl ?? null,
        identitySubmittedAt: new Date(),
      },
    });
    return { success: true, message: 'Government ID submitted for verification.' };
  }

  // ─── POST /companion/kyc/selfie ───────────────────────────────────────────────
  // SelfieCaptureScreen / LivenessDetectionScreen
  async submitSelfie(companionId: string, dto: { videoUrl: string }) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
      create: { companionId, selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
    });
    return { success: true, message: 'Selfie submitted for liveness verification.' };
  }

  // ─── POST /companion/kyc/address ─────────────────────────────────────────────
  // AddressVerificationScreen
  async submitAddress(companionId: string, dto: { documentType: string; documentUrl: string }) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        addressDocumentType: dto.documentType,
        addressDocumentUrl: dto.documentUrl,
        addressSubmittedAt: new Date(),
      },
      create: {
        companionId,
        addressDocumentType: dto.documentType,
        addressDocumentUrl: dto.documentUrl,
        addressSubmittedAt: new Date(),
      },
    });
    return { success: true, message: 'Address document submitted.' };
  }

  // ─── POST /companion/kyc/pan ─────────────────────────────────────────────────
  // PANTaxDetailsScreen — only masked PAN stored (privacy P0)
  async savePan(companionId: string, dto: { maskedPan: string; panName: string; hasGST: boolean; gstNumber?: string }) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        maskedPan: dto.maskedPan,
        panName: dto.panName,
        hasGST: dto.hasGST,
        gstNumber: dto.hasGST ? dto.gstNumber ?? null : null,
      },
      create: {
        companionId,
        maskedPan: dto.maskedPan,
        panName: dto.panName,
        hasGST: dto.hasGST,
        gstNumber: dto.hasGST ? dto.gstNumber ?? null : null,
      },
    });
    return { success: true, message: 'PAN details saved.' };
  }

  // ─── POST /companion/kyc/bank ────────────────────────────────────────────────
  // AddBankAccountScreen — only last 4 digits stored (privacy P0)
  async saveBank(companionId: string, dto: { holderName: string; maskedAccount: string; ifsc: string; accountType: string; bankName: string }) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        bankHolderName: dto.holderName,
        maskedBankAccount: dto.maskedAccount,
        bankIfsc: dto.ifsc,
        bankAccountType: dto.accountType,
        bankName: dto.bankName,
        bankVerified: false,
      },
      create: {
        companionId,
        bankHolderName: dto.holderName,
        maskedBankAccount: dto.maskedAccount,
        bankIfsc: dto.ifsc,
        bankAccountType: dto.accountType,
        bankName: dto.bankName,
        bankVerified: false,
      },
    });
    return {
      success: true,
      bankId: `bank-${companionId.slice(-8)}`,
      maskedAccount: dto.maskedAccount,
      bankName: dto.bankName,
      message: 'Bank account submitted for verification.',
    };
  }

  // ─── POST /companion/kyc/bank/verify ─────────────────────────────────────────
  // BankAccountVerificationScreen
  async verifyBank(companionId: string, dto: { bankId: string }) {
    const kyc = await this.prisma.companionKYC.findUnique({ where: { companionId } });
    if (!kyc?.maskedBankAccount) throw new BadRequestException('No bank account found to verify');
    // Simulate penny drop verification
    await this.prisma.companionKYC.update({
      where: { companionId },
      data: { bankVerified: true },
    });
    return {
      success: true,
      verified: true,
      maskedAccount: kyc.maskedBankAccount,
      bankName: kyc.bankName,
      message: 'Bank account verified successfully.',
    };
  }

  // ─── POST /companion/kyc/upi ─────────────────────────────────────────────────
  // UPIDetailsScreen — only masked UPI stored (privacy P0)
  async saveUpi(companionId: string, dto: { maskedUpi: string; payoutLabel: string; isPrimary: boolean }) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { maskedUpi: dto.maskedUpi, upiPayoutLabel: dto.payoutLabel, upiIsPrimary: dto.isPrimary },
      create: { companionId, maskedUpi: dto.maskedUpi, upiPayoutLabel: dto.payoutLabel, upiIsPrimary: dto.isPrimary },
    });
    return { success: true, maskedUpi: dto.maskedUpi, message: 'UPI ID saved for payouts.' };
  }

  // ─── POST /companion/kyc/emergency-contact ───────────────────────────────────
  // EmergencyContactSetupScreen
  async saveEmergencyContact(companionId: string, dto: { name: string; maskedPhone: string; relationship: string }) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        emergencyContactName: dto.name,
        emergencyContactMaskedPhone: dto.maskedPhone,
        emergencyContactRelationship: dto.relationship,
      },
      create: {
        companionId,
        emergencyContactName: dto.name,
        emergencyContactMaskedPhone: dto.maskedPhone,
        emergencyContactRelationship: dto.relationship,
      },
    });
    return { success: true, message: 'Emergency contact saved.' };
  }

  // ─── POST /companion/kyc/declaration ─────────────────────────────────────────
  // BackgroundDeclarationScreen
  async saveDeclaration(companionId: string, dto: { agreedAt: string }) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { declarationAgreedAt: new Date(dto.agreedAt) },
      create: { companionId, declarationAgreedAt: new Date(dto.agreedAt) },
    });
    return { success: true, message: 'Declaration confirmed.' };
  }

  // ─── POST /companion/kyc/submit ──────────────────────────────────────────────
  // SubmitProfileForApprovalScreen — final submission
  async submitKyc(companionId: string) {
    const kyc = await this.prisma.companionKYC.findUnique({ where: { companionId } });
    if (!kyc) throw new BadRequestException('KYC data not found. Please complete all steps.');

    await this.prisma.companionKYC.update({
      where: { companionId },
      data: { submittedAt: new Date() },
    });

    await this.prisma.companion.update({
      where: { id: companionId },
      data: {
        verificationStatus: 'PENDING',
        profileStatus: 'SUBMITTED',
      },
    });

    return {
      success: true,
      message: 'Your application has been submitted for review. We will notify you within 2–3 business days.',
      submittedAt: new Date().toISOString(),
    };
  }

  // ─── POST /companion/kyc/resubmit ────────────────────────────────────────────
  // ResubmitVerificationScreen
  async resubmitKyc(companionId: string, dto: { updatedDocuments: string[] }) {
    await this.prisma.companionKYC.update({
      where: { companionId },
      data: {
        submittedAt: new Date(),
        rejectionReason: null,
        rejectedAt: null,
      },
    });
    await this.prisma.companion.update({
      where: { id: companionId },
      data: { verificationStatus: 'PENDING', profileStatus: 'SUBMITTED' },
    });
    return {
      success: true,
      message: 'Documents resubmitted for review.',
      submittedAt: new Date().toISOString(),
    };
  }
}
