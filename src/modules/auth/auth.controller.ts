import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  SetPinDto,
  VerifyPinDto,
  RefreshTokenDto,
  BiometricEnrollDto,
  LogoutDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from './strategies/jwt.strategy';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth/companion')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/companion/otp/send
   * Frontend: Endpoints.AUTH.SEND_OTP
   * Screen: PhoneLoginScreen (CPN-002)
   */
  @Post('otp/send')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number', description: 'Rate limited to 5/min. Dev OTP: 123456' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  /**
   * POST /api/v1/auth/companion/otp/verify
   * Frontend: Endpoints.AUTH.VERIFY_OTP
   * Screen: OTPVerificationScreen (CPN-003)
   */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and login/register companion' })
  @ApiResponse({
    status: 200,
    description: 'Returns accessToken, refreshToken, isNewCompanion, profileStatus',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * POST /api/v1/auth/companion/token/refresh
   * Frontend: Endpoints.AUTH.REFRESH_TOKEN
   */
  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  /**
   * POST /api/v1/auth/companion/logout
   * Frontend: Endpoints.AUTH.LOGOUT
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('companion-jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout companion (revoke refresh token)' })
  async logout(@CurrentCompanion() companion: JwtPayload, @Body() dto: LogoutDto) {
    return this.authService.logout(companion.sub, dto.deviceId);
  }

  /**
   * POST /api/v1/auth/companion/pin/set
   * Frontend: Endpoints.AUTH.SET_PIN
   * Screen: CreatePINScreen (CPN-007)
   */
  @Post('pin/set')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('companion-jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set or update PIN for companion' })
  async setPin(@CurrentCompanion() companion: JwtPayload, @Body() dto: SetPinDto) {
    return this.authService.setPin(companion.sub, dto);
  }

  /**
   * POST /api/v1/auth/companion/pin/verify
   * Frontend: Endpoints.AUTH.VERIFY_PIN
   * Screen: ConfirmPINScreen (CPN-008) / PIN login
   */
  @Post('pin/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('companion-jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify PIN and return new token pair' })
  async verifyPin(@CurrentCompanion() companion: JwtPayload, @Body() dto: VerifyPinDto) {
    return this.authService.verifyPin(companion.sub, dto);
  }

  /**
   * POST /api/v1/auth/companion/biometric/enroll
   * Frontend: Endpoints.AUTH.BIOMETRIC_ENROLL
   * Screen: BiometricSetupScreen (CPN-009)
   */
  @Post('biometric/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('companion-jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enroll biometric public key for device' })
  async enrollBiometric(@CurrentCompanion() companion: JwtPayload, @Body() dto: BiometricEnrollDto) {
    return this.authService.enrollBiometric(companion.sub, dto);
  }
}
