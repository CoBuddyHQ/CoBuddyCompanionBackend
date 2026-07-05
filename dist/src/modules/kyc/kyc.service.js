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
    async uploadIdentity(companionId, dto) {
        await this.prisma.companionKYC.upsert({
            where: { companionId },
            update: { identityDocumentType: dto.documentType, identityDocumentUrl: dto.documentUrl },
            create: { companionId, identityDocumentType: dto.documentType, identityDocumentUrl: dto.documentUrl },
        });
        return { message: 'Identity document uploaded' };
    }
    async uploadSelfie(companionId, dto) {
        await this.prisma.companionKYC.upsert({
            where: { companionId },
            update: { selfieVideoUrl: dto.videoUrl },
            create: { companionId, selfieVideoUrl: dto.videoUrl },
        });
        return { message: 'Selfie video uploaded' };
    }
    async uploadAddress(companionId, dto) {
        await this.prisma.companionKYC.upsert({
            where: { companionId },
            update: { addressDocumentUrl: dto.documentUrl },
            create: { companionId, addressDocumentUrl: dto.documentUrl },
        });
        return { message: 'Address document uploaded' };
    }
    async uploadPolice(companionId, dto) {
        await this.prisma.companionKYC.upsert({
            where: { companionId },
            update: { policeVerificationUrl: dto.documentUrl },
            create: { companionId, policeVerificationUrl: dto.documentUrl },
        });
        return { message: 'Police verification document uploaded' };
    }
    getDocStatus(kyc, type) {
        if (kyc.approvedAt)
            return 'approved';
        if (kyc.rejectionReason)
            return 'rejected';
        if (kyc.submittedAt)
            return 'pending';
        switch (type) {
            case 'identity': return kyc.identityDocumentUrl ? 'uploaded' : 'missing';
            case 'selfie': return kyc.selfieVideoUrl ? 'uploaded' : 'missing';
            case 'address': return kyc.addressDocumentUrl ? 'uploaded' : 'missing';
            case 'police': return kyc.policeVerificationUrl ? 'uploaded' : 'missing';
            default: return 'missing';
        }
    }
};
exports.KycService = KycService;
exports.KycService = KycService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KycService);
//# sourceMappingURL=kyc.service.js.map