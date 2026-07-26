import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BasicDetailsDto, SaveDeclarationDto, SubmitGovernmentIdDto, UpdateGovernmentIdTypeDto, SubmitSelfieDto, SaveAddressDto, SavePanDto, SaveBankDto, VerifyBankDto, SaveUpiDto } from './dto/kyc.dto';

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
    if (dto.email && dto.email.trim().length > 0) companionData.email = dto.email.trim();
    if (dto.dateOfBirth) {
      const parsedDate = new Date(dto.dateOfBirth);
      if (!isNaN(parsedDate.getTime())) {
        companionData.dateOfBirth = parsedDate;
      }
    }
    if (dto.gender) companionData.gender = dto.gender;
    if (dto.displayName) companionData.displayName = dto.displayName;

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
      data: { profileStatus: 'draft' },
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

  // ─── POST /companion/kyc/government-id-type ───────────────────────────────
  // GovernmentIDTypeScreen — save selected ID type
  async updateGovernmentIdType(companionId: string, dto: UpdateGovernmentIdTypeDto) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { identityDocumentType: dto.documentType },
      create: { companionId, identityDocumentType: dto.documentType },
    });
    return { success: true, message: 'Government ID type saved successfully.' };
  }

  // ─── POST /companion/kyc/government-id ───────────────────────────────────────
  // GovernmentIDUploadScreen — uploads ID docs
  async submitGovernmentId(companionId: string, dto: SubmitGovernmentIdDto) {
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
  async submitSelfie(companionId: string, dto: SubmitSelfieDto) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { selfieImageUrl: dto.imageUrl, selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
      create: { companionId, selfieImageUrl: dto.imageUrl, selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
    });
    return { success: true, message: 'Selfie submitted for liveness verification.' };
  }

  // ─── POST /companion/kyc/address ─────────────────────────────────────────────
  // AddressVerificationScreen
  async saveAddress(companionId: string, dto: SaveAddressDto) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        addressLine1: dto.line1,
        addressLine2: dto.line2,
        addressCity: dto.city,
        addressState: dto.state,
        addressPinCode: dto.pinCode,
        addressType: dto.addressType,
        addressIdMatch: dto.idMatch,
        addressDocumentType: dto.addressDocumentType,
        addressDocumentUrl: dto.addressDocumentUrl,
        addressSubmittedAt: new Date(),
      },
      create: {
        companionId,
        addressLine1: dto.line1,
        addressLine2: dto.line2,
        addressCity: dto.city,
        addressState: dto.state,
        addressPinCode: dto.pinCode,
        addressType: dto.addressType,
        addressIdMatch: dto.idMatch,
        addressDocumentType: dto.addressDocumentType,
        addressDocumentUrl: dto.addressDocumentUrl,
        addressSubmittedAt: new Date(),
      },
    });
    return { success: true, message: 'Address details saved successfully.' };
  }

  // ─── POST /companion/kyc/upi ─────────────────────────────────────────────────
  // UPIDetailsScreen
  async saveUpi(companionId: string, dto: SaveUpiDto) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        maskedUpi: dto.maskedUpi,
        upiPayoutLabel: dto.payoutLabel,
        upiIsPrimary: dto.isPrimary ?? true,
      },
      create: {
        companionId,
        maskedUpi: dto.maskedUpi,
        upiPayoutLabel: dto.payoutLabel,
        upiIsPrimary: dto.isPrimary ?? true,
      },
    });
    return { success: true, message: 'UPI details saved.' };
  }

  // ─── POST /companion/kyc/pan ─────────────────────────────────────────────────
  // PANTaxDetailsScreen
  async savePan(companionId: string, dto: SavePanDto) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        maskedPan: dto.maskedPan,
        panName: dto.panName,
        taxResidency: dto.taxResidency,
        hasGST: dto.hasGST,
        gstNumber: dto.hasGST ? dto.gstNumber ?? null : null,
      },
      create: {
        companionId,
        maskedPan: dto.maskedPan,
        panName: dto.panName,
        taxResidency: dto.taxResidency,
        hasGST: dto.hasGST,
        gstNumber: dto.hasGST ? dto.gstNumber ?? null : null,
      },
    });
    return { success: true, message: 'PAN details saved.' };
  }

  // ─── POST /companion/kyc/bank ────────────────────────────────────────────────
  // AddBankAccountScreen — only last 4 digits stored (privacy P0)
  async saveBank(companionId: string, dto: SaveBankDto) {
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
  async verifyBank(companionId: string, dto: VerifyBankDto) {
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
  async saveDeclaration(companionId: string, dto: SaveDeclarationDto) {
    const { agreedAt, ...consents } = dto;
    const dateAgreed = agreedAt ? new Date(agreedAt) : new Date();
    
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { 
        declarationAgreedAt: dateAgreed,
        declarationConsents: consents,
      },
      create: { 
        companionId, 
        declarationAgreedAt: dateAgreed,
        declarationConsents: consents,
      },
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
        verificationStatus: 'pending_review',
        profileStatus: 'submitted',
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
      data: { verificationStatus: 'pending_review', profileStatus: 'submitted' },
    });
    return {
      success: true,
      message: 'Documents resubmitted for review.',
      submittedAt: new Date().toISOString(),
    };
  }
}
