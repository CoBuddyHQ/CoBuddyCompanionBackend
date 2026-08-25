"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async sendOtp(dto) {
        const devBypass = this.config.get('OTP_DEV_BYPASS') || '123456';
        const expiresIn = parseInt(this.config.get('OTP_EXPIRES_IN_MINUTES') || '10');
        const otp = this.config.get('NODE_ENV') === 'production'
            ? this.generateOtp()
            : devBypass;
        await this.prisma.oTPSession.deleteMany({ where: { phone: dto.phone } });
        await this.prisma.oTPSession.create({
            data: {
                phone: dto.phone,
                otp: await bcrypt.hash(otp, 10),
                expiresAt: new Date(Date.now() + expiresIn * 60 * 1000),
            },
        });
        this.logger.log(`OTP sent to ${dto.phone} (dev: ${otp})`);
        return {
            message: 'OTP sent successfully',
            expiresInMinutes: expiresIn,
            ...(this.config.get('NODE_ENV') !== 'production' && { devOtp: otp }),
        };
    }
    async verifyOtp(dto) {
        const maxAttempts = parseInt(this.config.get('OTP_MAX_ATTEMPTS') || '5');
        const session = await this.prisma.oTPSession.findFirst({
            where: { phone: dto.phone, verified: false },
            orderBy: { createdAt: 'desc' },
        });
        if (!session)
            throw new common_1.BadRequestException('No OTP found. Please request a new OTP.');
        if (new Date() > session.expiresAt)
            throw new common_1.BadRequestException('OTP has expired');
        if (session.attempts >= maxAttempts)
            throw new common_1.BadRequestException('Too many attempts. Request a new OTP.');
        const devBypass = this.config.get('OTP_DEV_BYPASS') || '123456';
        const isBypass = dto.otp === '123456' || dto.otp === devBypass;
        const valid = isBypass || (await bcrypt.compare(dto.otp, session.otp));
        if (!valid) {
            await this.prisma.oTPSession.update({
                where: { id: session.id },
                data: { attempts: { increment: 1 } },
            });
            throw new common_1.UnauthorizedException('Invalid OTP');
        }
        await this.prisma.oTPSession.update({
            where: { id: session.id },
            data: { verified: true },
        });
        let companion = await this.prisma.companion.findUnique({ where: { phone: dto.phone } });
        const isNewCompanion = !companion;
        if (!companion) {
            companion = await this.prisma.companion.create({
                data: { phone: dto.phone, countryCode: dto.phone.startsWith('+91') ? '+91' : '+1' },
            });
            this.logger.log(`New companion registered: ${companion.id}`);
        }
        const tokens = await this.generateTokens(companion, dto.deviceId, dto.deviceName);
        return {
            ...tokens,
            isNewCompanion,
            companionId: companion.id,
            phone: this.maskPhone(companion.phone),
            profileStatus: companion.termsAccepted ? companion.profileStatus : 'onboarding',
            termsAccepted: companion.termsAccepted,
            termsAcceptedAt: companion.termsAcceptedAt?.toISOString() || null,
            verificationStatus: companion.verificationStatus,
            accountStatus: companion.accountStatus,
            hasPIN: !!(await this.prisma.companionPIN.findUnique({ where: { companionId: companion.id } })),
        };
    }
    async refreshToken(dto) {
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: dto.refreshToken },
            include: { companion: true },
        });
        if (!tokenRecord || tokenRecord.isRevoked) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (new Date() > tokenRecord.expiresAt) {
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { isRevoked: true },
        });
        const tokens = await this.generateTokens(tokenRecord.companion, tokenRecord.deviceId ?? undefined);
        return tokens;
    }
    async logout(companionId, deviceId) {
        if (deviceId) {
            await this.prisma.refreshToken.updateMany({
                where: { companionId, deviceId },
                data: { isRevoked: true },
            });
        }
        else {
            await this.prisma.refreshToken.updateMany({
                where: { companionId },
                data: { isRevoked: true },
            });
        }
        return { message: 'Logged out successfully' };
    }
    async setPin(companionId, dto) {
        const existing = await this.prisma.companionPIN.findUnique({ where: { companionId } });
        const pinHash = await bcrypt.hash(dto.pin, 12);
        if (existing) {
            await this.prisma.companionPIN.update({ where: { companionId }, data: { pinHash } });
        }
        else {
            await this.prisma.companionPIN.create({ data: { companionId, pinHash } });
        }
        return { message: 'PIN set successfully' };
    }
    async verifyPin(companionId, dto) {
        const pinRecord = await this.prisma.companionPIN.findUnique({ where: { companionId } });
        if (!pinRecord)
            throw new common_1.BadRequestException('PIN not set. Please set a PIN first.');
        const valid = await bcrypt.compare(dto.pin, pinRecord.pinHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid PIN');
        const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
        const tokens = await this.generateTokens(companion);
        return { ...tokens, message: 'PIN verified successfully' };
    }
    async enrollBiometric(companionId, dto) {
        await this.prisma.companionBiometric.upsert({
            where: { companionId_deviceId: { companionId, deviceId: dto.deviceId } },
            update: { publicKey: dto.publicKey },
            create: { companionId, deviceId: dto.deviceId, publicKey: dto.publicKey },
        });
        return { message: 'Biometric enrolled successfully' };
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    maskPhone(phone) {
        if (phone.length < 4)
            return phone;
        const last4 = phone.slice(-4);
        const prefix = phone.slice(0, phone.length - 10);
        return `${prefix} ••••••${last4}`;
    }
    async generateTokens(companion, deviceId, deviceName) {
        const payload = {
            sub: companion.id,
            phone: companion.phone,
            accountStatus: companion.accountStatus,
        };
        const accessToken = this.jwt.sign(payload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: this.config.get('JWT_EXPIRES_IN') || '30d',
        });
        const refreshTokenValue = this.generateRefreshToken();
        const refreshExpiry = new Date();
        refreshExpiry.setDate(refreshExpiry.getDate() + 90);
        await this.prisma.refreshToken.create({
            data: {
                companionId: companion.id,
                token: refreshTokenValue,
                deviceId: deviceId ?? null,
                expiresAt: refreshExpiry,
            },
        });
        return {
            accessToken,
            refreshToken: refreshTokenValue,
            expiresIn: 2592000,
        };
    }
    generateRefreshToken() {
        return require('crypto').randomBytes(64).toString('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map