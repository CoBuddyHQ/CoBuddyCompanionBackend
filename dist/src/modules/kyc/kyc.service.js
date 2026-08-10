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
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const progress_engine_service_1 = require("./progress-engine.service");
let KycService = class KycService {
    constructor(prisma, progressEngine) {
        this.prisma = prisma;
        this.progressEngine = progressEngine;
    }
    async getKycStatus(companionId) {
        const onboardingStatus = await this.progressEngine.getOnboardingStatus(companionId);
        return { success: true, onboardingStatus };
    }
    async logCompletion(companionId, stepName, screenName, percentage = 100) {
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
        }
        catch {
        }
    }
    async saveBasicDetails(companionId, dto) {
        const companionData = {};
        if (dto.email && dto.email.trim().length > 0)
            companionData.email = dto.email.trim();
        if (dto.dateOfBirth) {
            const parsedDate = new Date(dto.dateOfBirth);
            if (!isNaN(parsedDate.getTime())) {
                companionData.dateOfBirth = parsedDate;
            }
        }
        if (dto.gender)
            companionData.gender = dto.gender;
        if (dto.displayName)
            companionData.displayName = dto.displayName;
        if (Object.keys(companionData).length > 0) {
            try {
                await this.prisma.companion.update({
                    where: { id: companionId },
                    data: companionData,
                });
            }
            catch (error) {
                if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                    throw new common_1.ConflictException('This email is already registered to another account.');
                }
                throw error;
            }
        }
        const kycData = {};
        if (dto.legalName) {
            const parts = dto.legalName.trim().split(' ');
            kycData.legalFirstName = parts[0] || '';
            kycData.legalLastName = parts.slice(1).join(' ') || '';
        }
        if (dto.legalFirstName !== undefined)
            kycData.legalFirstName = dto.legalFirstName;
        if (dto.legalLastName !== undefined)
            kycData.legalLastName = dto.legalLastName;
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
    async saveDraft(companionId, dto) {
        await this.prisma.companion.update({
            where: { id: companionId },
            data: { profileStatus: 'draft' },
        });
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
    async updateGovernmentIdType(companionId, dto) {
        await this.prisma.companionKYC.upsert({
            where: { companionId },
            update: { identityDocumentType: dto.documentType },
            create: { companionId, identityDocumentType: dto.documentType },
        });
        return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Government ID type saved successfully.' };
    }
    async submitGovernmentId(companionId, dto) {
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
    async submitSelfie(companionId, dto) {
        await this.prisma.companionKYC.upsert({
            where: { companionId },
            update: { selfieImageUrl: dto.imageUrl, selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
            create: { companionId, selfieImageUrl: dto.imageUrl, selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
        });
        return { success: true, onboardingStatus: await this.progressEngine.getOnboardingStatus(companionId), message: 'Selfie submitted for liveness verification.' };
    }
    async saveAddress(companionId, dto) {
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
    async saveUpi(companionId, dto) {
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
    async savePan(companionId, dto) {
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
    async saveBank(companionId, dto) {
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
    async verifyBank(companionId, dto) {
        const kyc = await this.prisma.companionKYC.findUnique({ where: { companionId } });
        if (!kyc?.maskedBankAccount)
            throw new common_1.BadRequestException('No bank account found to verify');
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
    async saveEmergencyContact(companionId, dto) {
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
    async saveDeclaration(companionId, dto) {
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
    async submitKyc(companionId) {
        const kyc = await this.prisma.companionKYC.findUnique({ where: { companionId } });
        if (!kyc)
            throw new common_1.BadRequestException('KYC data not found. Please complete all steps.');
        await this.prisma.companionKYC.update({
            where: { companionId },
            data: { submittedAt: new Date() },
        });
        const updateData = {
            verificationStatus: 'pending_review',
            profileStatus: 'submitted',
        };
        if (kyc.draftData) {
            try {
                const draft = typeof kyc.draftData === 'string' ? JSON.parse(kyc.draftData) : kyc.draftData;
                if (draft.professionalBio)
                    updateData.bio = draft.professionalBio;
                if (draft.city)
                    updateData.city = draft.city;
                if (draft.sessionRateINR)
                    updateData.hourlyRate = draft.sessionRateINR;
                if (draft.sessionDurationMins)
                    updateData.sessionDuration = draft.sessionDurationMins;
                if (Array.isArray(draft.spokenLanguages) && draft.spokenLanguages.length > 0) {
                    await this.prisma.companionLanguage.deleteMany({ where: { companionId } });
                    await this.prisma.companionLanguage.createMany({
                        data: draft.spokenLanguages.map((lang, i) => ({
                            companionId,
                            language: lang,
                            isPrimary: i === 0,
                        })),
                    });
                }
                if (Array.isArray(draft.broadAreas) && draft.broadAreas.length > 0) {
                    await this.prisma.companionServiceArea.deleteMany({ where: { companionId } });
                    await this.prisma.companionServiceArea.createMany({
                        data: draft.broadAreas.map((area) => ({
                            companionId,
                            areaName: area,
                        })),
                    });
                }
                if (Array.isArray(draft.experienceCategories) && draft.experienceCategories.length > 0) {
                    await this.prisma.companionCategory.deleteMany({ where: { companionId } });
                    await this.prisma.companionCategory.createMany({
                        data: draft.experienceCategories.map((cat) => ({
                            companionId,
                            categoryName: cat,
                        })),
                    });
                }
            }
            catch (e) {
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
    async resubmitKyc(companionId, dto) {
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
};
exports.KycService = KycService;
exports.KycService = KycService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, progress_engine_service_1.ProgressEngineService])
], KycService);
//# sourceMappingURL=kyc.service.js.map