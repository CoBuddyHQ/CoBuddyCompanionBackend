import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, SetPinDto, VerifyPinDto, RefreshTokenDto, BiometricEnrollDto, LogoutDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendOtp(dto: SendOtpDto): Promise<{
        devOtp: string;
        message: string;
        expiresInMinutes: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        isNewCompanion: boolean;
        companionId: string;
        phone: string;
        profileStatus: import("@prisma/client").$Enums.ProfileStatus;
        verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
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
    logout(companion: JwtPayload, dto: LogoutDto): Promise<{
        message: string;
    }>;
    setPin(companion: JwtPayload, dto: SetPinDto): Promise<{
        message: string;
    }>;
    verifyPin(companion: JwtPayload, dto: VerifyPinDto): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    enrollBiometric(companion: JwtPayload, dto: BiometricEnrollDto): Promise<{
        message: string;
    }>;
}
