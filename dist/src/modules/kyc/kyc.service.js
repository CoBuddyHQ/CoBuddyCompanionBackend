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
let KycService = class KycService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getKycStatus(companionId) {
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
    async saveBasicDetails(companionId, dto) {
        const companionData = {};
        if (dto.email !== undefined)
            companionData.email = dto.email;
        if (dto.dateOfBirth !== undefined)
            companionData.dateOfBirth = new Date(dto.dateOfBirth);
        if (dto.gender !== undefined)
            companionData.gender = dto.gender;
        if (dto.displayName !== undefined)
            companionData.displayName = dto.displayName;
        if (Object.keys(companionData).length > 0) {
            await this.prisma.companion.update({
                where: { id: companionId },
                data: companionData,
            });
        }
        const kycData = {};
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
        return { success: true, message: 'Basic details saved successfully' };
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
        return {
            success: true,
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
        return { success: true, message: 'Government ID type saved successfully.' };
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
        return { success: true, message: 'Government ID submitted for verification.' };
    }
    async submitSelfie(companionId, dto) {
        await this.prisma.companionKYC.upsert({
            where: { companionId },
            update: { selfieImageUrl: dto.imageUrl, selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
            create: { companionId, selfieImageUrl: dto.imageUrl, selfieVideoUrl: dto.videoUrl, selfieSubmittedAt: new Date() },
        });
        return { success: true, message: 'Selfie submitted for liveness verification.' };
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
        return { success: true, message: 'Address details saved successfully.' };
    }
    async saveUpi(companionId, dto) {
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
    async savePan(companionId, dto) {
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
    async saveBank(companionId, dto) {
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
    async verifyBank(companionId, dto) {
        const kyc = await this.prisma.companionKYC.findUnique({ where: { companionId } });
        if (!kyc?.maskedBankAccount)
            throw new common_1.BadRequestException('No bank account found to verify');
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
        return { success: true, message: 'Emergency contact saved.' };
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
        return { success: true, message: 'Declaration confirmed.' };
    }
    async submitKyc(companionId) {
        const kyc = await this.prisma.companionKYC.findUnique({ where: { companionId } });
        if (!kyc)
            throw new common_1.BadRequestException('KYC data not found. Please complete all steps.');
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
        return {
            success: true,
            message: 'Documents resubmitted for review.',
            submittedAt: new Date().toISOString(),
        };
    }
};
exports.KycService = KycService;
exports.KycService = KycService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KycService);
//# sourceMappingURL=kyc.service.js.map