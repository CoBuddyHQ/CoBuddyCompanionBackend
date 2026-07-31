import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  SendOtpDto,
  VerifyOtpDto,
  SetPinDto,
  VerifyPinDto,
  RefreshTokenDto,
  BiometricEnrollDto,
} from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ── POST /auth/companion/otp/send ─────────────────────────────────────────

  async sendOtp(dto: SendOtpDto) {
    const devBypass = this.config.get<string>('OTP_DEV_BYPASS') || '123456';
    const expiresIn = parseInt(this.config.get('OTP_EXPIRES_IN_MINUTES') || '10');

    // In dev mode always use bypass OTP
    const otp = this.config.get('NODE_ENV') === 'production'
      ? this.generateOtp()
      : devBypass;

    // Invalidate old OTPs
    await this.prisma.oTPSession.deleteMany({ where: { phone: dto.phone } });

    await this.prisma.oTPSession.create({
      data: {
        phone: dto.phone,
        otp: await bcrypt.hash(otp, 10),
        expiresAt: new Date(Date.now() + expiresIn * 60 * 1000),
      },
    });

    this.logger.log(`OTP sent to ${dto.phone} (dev: ${otp})`);

    // TODO: Send via SMS provider (Twilio/MSG91) in production
    return {
      message: 'OTP sent successfully',
      expiresInMinutes: expiresIn,
      // Only expose in dev
      ...(this.config.get('NODE_ENV') !== 'production' && { devOtp: otp }),
    };
  }

  // ── POST /auth/companion/otp/verify ──────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto) {
    const maxAttempts = parseInt(this.config.get('OTP_MAX_ATTEMPTS') || '5');

    const session = await this.prisma.oTPSession.findFirst({
      where: { phone: dto.phone, verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) throw new BadRequestException('No OTP found. Please request a new OTP.');
    if (new Date() > session.expiresAt) throw new BadRequestException('OTP has expired');
    if (session.attempts >= maxAttempts) throw new BadRequestException('Too many attempts. Request a new OTP.');

    const devBypass = this.config.get<string>('OTP_DEV_BYPASS') || '123456';
    const isBypass = dto.otp === '123456' || dto.otp === devBypass;

    const valid = isBypass || (await bcrypt.compare(dto.otp, session.otp));
    if (!valid) {
      await this.prisma.oTPSession.update({
        where: { id: session.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.prisma.oTPSession.update({
      where: { id: session.id },
      data: { verified: true },
    });

    // Get or create companion
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
      profileStatus: companion.profileStatus,
      verificationStatus: companion.verificationStatus,
      accountStatus: companion.accountStatus,
      hasPIN: !!(await this.prisma.companionPIN.findUnique({ where: { companionId: companion.id } })),
    };
  }

  // ── POST /auth/companion/token/refresh ────────────────────────────────────

  async refreshToken(dto: RefreshTokenDto) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { companion: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotate token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(tokenRecord.companion, tokenRecord.deviceId ?? undefined);
    return tokens;
  }

  // ── POST /auth/companion/logout ───────────────────────────────────────────

  async logout(companionId: string, deviceId?: string) {
    if (deviceId) {
      await this.prisma.refreshToken.updateMany({
        where: { companionId, deviceId },
        data: { isRevoked: true },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { companionId },
        data: { isRevoked: true },
      });
    }
    return { message: 'Logged out successfully' };
  }

  // ── POST /auth/companion/pin/set ──────────────────────────────────────────

  async setPin(companionId: string, dto: SetPinDto) {
    const existing = await this.prisma.companionPIN.findUnique({ where: { companionId } });
    const pinHash = await bcrypt.hash(dto.pin, 12);

    if (existing) {
      await this.prisma.companionPIN.update({ where: { companionId }, data: { pinHash } });
    } else {
      await this.prisma.companionPIN.create({ data: { companionId, pinHash } });
    }
    return { message: 'PIN set successfully' };
  }

  // ── POST /auth/companion/pin/verify ──────────────────────────────────────

  async verifyPin(companionId: string, dto: VerifyPinDto) {
    const pinRecord = await this.prisma.companionPIN.findUnique({ where: { companionId } });
    if (!pinRecord) throw new BadRequestException('PIN not set. Please set a PIN first.');

    const valid = await bcrypt.compare(dto.pin, pinRecord.pinHash);
    if (!valid) throw new UnauthorizedException('Invalid PIN');

    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    const tokens = await this.generateTokens(companion!);
    return { ...tokens, message: 'PIN verified successfully' };
  }

  // ── POST /auth/companion/biometric/enroll ─────────────────────────────────

  async enrollBiometric(companionId: string, dto: BiometricEnrollDto) {
    await this.prisma.companionBiometric.upsert({
      where: { companionId_deviceId: { companionId, deviceId: dto.deviceId } },
      update: { publicKey: dto.publicKey },
      create: { companionId, deviceId: dto.deviceId, publicKey: dto.publicKey },
    });
    return { message: 'Biometric enrolled successfully' };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private maskPhone(phone: string): string {
    if (phone.length < 4) return phone;
    const last4 = phone.slice(-4);
    const prefix = phone.slice(0, phone.length - 10);
    return `${prefix} ••••••${last4}`;
  }

  private async generateTokens(companion: any, deviceId?: string, deviceName?: string) {
    const payload: JwtPayload = {
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
      expiresIn: 2592000, // 30 days in seconds
    };
  }

  private generateRefreshToken(): string {
    return require('crypto').randomBytes(64).toString('hex');
  }
}
