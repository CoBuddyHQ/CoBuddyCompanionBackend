import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SendOtpDto, VerifyOtpDto, SetPinDto, VerifyPinDto, RefreshTokenDto, BiometricEnrollDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    sendOtp(dto: SendOtpDto): Promise<{
        devOtp: string;
        message: string;
        expiresInMinutes: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        isNewCompanion: boolean;
        companionId: string;
        phone: string;
        profileStatus: string;
        termsAccepted: boolean;
        termsAcceptedAt: string;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        hasPIN: boolean;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    logout(companionId: string, deviceId?: string): Promise<{
        message: string;
    }>;
    setPin(companionId: string, dto: SetPinDto): Promise<{
        message: string;
    }>;
    verifyPin(companionId: string, dto: VerifyPinDto): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    enrollBiometric(companionId: string, dto: BiometricEnrollDto): Promise<{
        message: string;
    }>;
    private generateOtp;
    private maskPhone;
    private generateTokens;
    private generateRefreshToken;
}
