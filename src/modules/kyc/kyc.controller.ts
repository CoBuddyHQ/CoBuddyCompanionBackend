import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { BasicDetailsDto } from './dto/kyc.dto';

@ApiTags('KYC')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /** POST /companion/kyc/basic-details — Endpoints.KYC.BASIC_DETAILS */
  @Post('companion/kyc/basic-details')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save basic details (Name, DOB, Gender, Email) — BasicDetailsScreen' })
  saveBasicDetails(@CurrentCompanion() c: JwtPayload, @Body() dto: BasicDetailsDto) {
    return this.kycService.saveBasicDetails(c.sub, dto);
  }

  /** GET /companion/kyc/status — Endpoints.KYC.STATUS */
  @Get('companion/kyc/status')
  @ApiOperation({ summary: 'Get full KYC + verification status — VerificationHubScreen' })
  getStatus(@CurrentCompanion() c: JwtPayload) {
    return this.kycService.getKycStatus(c.sub);
  }

  /** POST /companion/application/draft — Endpoints.KYC.SAVE_DRAFT */
  @Post('companion/application/draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save application progress as draft — ApplicationSavedDraftScreen' })
  saveDraft(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.saveDraft(c.sub, dto);
  }

  /** POST /companion/kyc/government-id — Endpoints.KYC.UPLOAD_GOVERNMENT_ID */
  @Post('companion/kyc/government-id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload government ID — GovernmentIDUploadScreen' })
  submitGovernmentId(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.submitGovernmentId(c.sub, dto);
  }

  /** POST /companion/kyc/selfie — Endpoints.KYC.UPLOAD_SELFIE */
  @Post('companion/kyc/selfie')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit selfie/liveness video — SelfieCaptureScreen' })
  submitSelfie(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.submitSelfie(c.sub, dto);
  }

  /** POST /companion/kyc/address — Endpoints.KYC.UPLOAD_ADDRESS */
  @Post('companion/kyc/address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit address document — AddressVerificationScreen' })
  submitAddress(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.submitAddress(c.sub, dto);
  }

  /** POST /companion/kyc/pan — Endpoints.KYC.SAVE_PAN */
  @Post('companion/kyc/pan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save PAN details (masked) — PANTaxDetailsScreen' })
  savePan(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.savePan(c.sub, dto);
  }

  /** POST /companion/kyc/bank — Endpoints.KYC.SAVE_BANK */
  @Post('companion/kyc/bank')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save bank account (last 4 digits only) — AddBankAccountScreen' })
  saveBank(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.saveBank(c.sub, dto);
  }

  /** POST /companion/kyc/bank/verify — Endpoints.KYC.VERIFY_BANK */
  @Post('companion/kyc/bank/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify bank account via penny drop — BankAccountVerificationScreen' })
  verifyBank(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.verifyBank(c.sub, dto);
  }

  /** POST /companion/kyc/upi — Endpoints.KYC.SAVE_UPI */
  @Post('companion/kyc/upi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save UPI ID (masked) — UPIDetailsScreen' })
  saveUpi(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.saveUpi(c.sub, dto);
  }

  /** POST /companion/kyc/emergency-contact — Endpoints.KYC.SAVE_EMERGENCY */
  @Post('companion/kyc/emergency-contact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save emergency contact — EmergencyContactSetupScreen' })
  saveEmergencyContact(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.saveEmergencyContact(c.sub, dto);
  }

  /** POST /companion/kyc/declaration — Endpoints.KYC.SAVE_DECLARATION */
  @Post('companion/kyc/declaration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm background declaration — BackgroundDeclarationScreen' })
  saveDeclaration(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.saveDeclaration(c.sub, dto);
  }

  /** POST /companion/kyc/submit — Endpoints.KYC.SUBMIT */
  @Post('companion/kyc/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Final KYC submission — SubmitProfileForApprovalScreen' })
  submitKyc(@CurrentCompanion() c: JwtPayload) {
    return this.kycService.submitKyc(c.sub);
  }

  /** POST /companion/kyc/resubmit — Endpoints.KYC.RESUBMIT */
  @Post('companion/kyc/resubmit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resubmit after rejection — ResubmitVerificationScreen' })
  resubmitKyc(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.resubmitKyc(c.sub, dto);
  }
}
