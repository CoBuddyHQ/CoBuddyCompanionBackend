import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProgressEngineService } from './progress-engine.service';
import { BasicDetailsDto, SaveDeclarationDto, SubmitGovernmentIdDto, UpdateGovernmentIdTypeDto, SubmitSelfieDto, SaveAddressDto, SavePanDto, SaveBankDto, VerifyBankDto, SaveUpiDto } from './dto/kyc.dto';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService, private progressEngine: ProgressEngineService) {}

  // ─── GET /companion/kyc/status ───────────────────────────────────────────────
  // Matches VerificationHubScreen — returns full KYC status
  async getKycStatus(companionId: string) {
    const onboardingStatus = await this.progressEngine.getOnboardingStatus(companionId);
    return { success: true, onboardingStatus };
  }

  private async logCompletion(companionId: string, stepName: string, screenName?: string, percentage: number = 100) {
    try {
      await this.prisma.moduleCompletion.create({
        data: {
          companionId,
          moduleName: 'kyc',
          stepName,
          screenName: screenName || stepName,
          completionStatus: 'completed',
          completionPercentage: percentage,
          lastScreen: screenName || stepName,
          lastAction: 'save',
          completedAt: new Date(),
        },
      });
    } catch {
      // Ignore duplicates or logging errors
    }
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
      try {
        await this.prisma.companion.update({
          where: { id: companionId },
          data: companionData,
        });
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
          throw new ConflictException('This email is already registered to another account.');
        }
        throw error;
      }
    }

    // 2. Update KYC record (legal names)
    const kycData: any = {};
    if (dto.legalName) {
      const parts = dto.legalName.trim().split(' ');
      kycData.legalFirstName = parts[0] || '';
      kycData.legalLastName = parts.slice(1).join(' ') || '';
    }
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

    await this.logCompletion(companionId, 'basic_details', 'BasicDetailsScreen', 10);
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Basic details saved successfully' };
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
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId),
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
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Government ID type saved successfully.' };
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
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Government ID submitted for verification.' };
  }

  // ─── POST /companion/kyc/selfie ───────────────────────────────────────────────
  // SelfieCaptureScreen / LivenessDetectionScreen
  async submitSelfie(companionId: string, dto: SubmitSelfieDto) {
    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: { selfieImageUrl: dto.imageUrl, selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
      create: { companionId, selfieImageUrl: dto.imageUrl, selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
    });
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Selfie submitted for liveness verification.' };
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
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Address details saved successfully.' };
  }

  // ─── POST /companion/kyc/upi ─────────────────────────────────────────────────
  // UPIDetailsScreen
  async saveUpi(companionId: string, dto: SaveUpiDto) {
    const rawUpi = dto.upiId || dto.maskedUpi || '';
    const maskedUpi = dto.maskedUpi || (rawUpi.includes('@') ? `${rawUpi.slice(0, 2)}••••@${rawUpi.split('@')[1]}` : rawUpi);

    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        maskedUpi,
        upiPayoutLabel: dto.payoutLabel,
        upiIsPrimary: dto.isPrimary ?? true,
      },
      create: {
        companionId,
        maskedUpi,
        upiPayoutLabel: dto.payoutLabel,
        upiIsPrimary: dto.isPrimary ?? true,
      },
    });
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'UPI details saved.' };
  }

  // ─── POST /companion/kyc/pan ─────────────────────────────────────────────────
  // PANTaxDetailsScreen
  async savePan(companionId: string, dto: SavePanDto) {
    const rawPan = dto.panNumber || dto.maskedPan || '';
    const maskedPan = dto.maskedPan || (rawPan.length >= 6 ? `${rawPan.slice(0, 4)}****${rawPan.slice(-2)}` : rawPan);

    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        maskedPan,
        panName: dto.panName,
        taxResidency: dto.taxResidency ?? 'India',
        hasGST: dto.hasGST ?? false,
        gstNumber: dto.hasGST ? dto.gstNumber ?? null : null,
      },
      create: {
        companionId,
        maskedPan,
        panName: dto.panName,
        taxResidency: dto.taxResidency ?? 'India',
        hasGST: dto.hasGST ?? false,
        gstNumber: dto.hasGST ? dto.gstNumber ?? null : null,
      },
    });
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'PAN details saved.' };
  }

  // ─── POST /companion/kyc/bank ────────────────────────────────────────────────
  // AddBankAccountScreen — only last 4 digits stored (privacy P0)
  async saveBank(companionId: string, dto: SaveBankDto) {
    const rawAcc = dto.accountNumber || dto.maskedAccount || '';
    const maskedAccount = dto.maskedAccount || (rawAcc.length >= 4 ? `••••${rawAcc.slice(-4)}` : rawAcc || '••••');

    await this.prisma.companionKYC.upsert({
      where: { companionId },
      update: {
        bankHolderName: dto.holderName,
        maskedBankAccount: maskedAccount,
        bankIfsc: dto.ifsc,
        bankAccountType: dto.accountType ?? 'savings',
        bankName: dto.bankName ?? 'Bank Account',
        bankVerified: false,
      },
      create: {
        companionId,
        bankHolderName: dto.holderName,
        maskedBankAccount: maskedAccount,
        bankIfsc: dto.ifsc,
        bankAccountType: dto.accountType ?? 'savings',
        bankName: dto.bankName ?? 'Bank Account',
        bankVerified: false,
      },
    });
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId),
      bankId: `bank-${companionId.slice(-8)}`,
      maskedAccount,
      bankName: dto.bankName ?? 'Bank Account',
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
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId),
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
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Emergency contact saved.' };
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
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Declaration confirmed.' };
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

    const updateData: any = {
      verificationStatus: 'pending_review',
      profileStatus: 'submitted',
    };

    if (kyc.draftData) {
      try {
        const draft = typeof kyc.draftData === 'string' ? JSON.parse(kyc.draftData) : kyc.draftData;
        if (draft.professionalBio) updateData.bio = draft.professionalBio;
        if (draft.city) updateData.city = draft.city;
        if (draft.sessionRateINR) updateData.hourlyRate = draft.sessionRateINR;
        if (draft.sessionDurationMins) updateData.sessionDuration = draft.sessionDurationMins;

        if (Array.isArray(draft.spokenLanguages) && draft.spokenLanguages.length > 0) {
          await this.prisma.companionLanguage.deleteMany({ where: { companionId } });
          await this.prisma.companionLanguage.createMany({
            data: draft.spokenLanguages.map((lang: string, i: number) => ({
              companionId,
              language: lang,
              isPrimary: i === 0,
            })),
          });
        }

        if (Array.isArray(draft.broadAreas) && draft.broadAreas.length > 0) {
          await this.prisma.companionServiceArea.deleteMany({ where: { companionId } });
          await this.prisma.companionServiceArea.createMany({
            data: draft.broadAreas.map((area: string) => ({
              companionId,
              areaName: area,
            })),
          });
        }

        if (Array.isArray(draft.experienceCategories) && draft.experienceCategories.length > 0) {
          await this.prisma.companionCategory.deleteMany({ where: { companionId } });
          await this.prisma.companionCategory.createMany({
            data: draft.experienceCategories.map((cat: string) => ({
              companionId,
              categoryName: cat,
            })),
          });
        }
      } catch (e) {
        // Fallback if JSON parse fails
      }
    }

    await this.prisma.companion.update({
      where: { id: companionId },
      data: updateData,
    });

    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId),
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
    return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId),
      message: 'Documents resubmitted for review.',
      submittedAt: new Date().toISOString(),
    };
  }
}
