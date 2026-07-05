import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('KYC')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status') @ApiOperation({ summary: 'Get KYC status' })
  getStatus(@CurrentCompanion() c: JwtPayload) {
    return this.kycService.getKycStatus(c.sub);
  }

  @Post('identity') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Upload identity document' })
  uploadIdentity(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.uploadIdentity(c.sub, dto);
  }

  @Post('selfie') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Upload selfie video' })
  uploadSelfie(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.uploadSelfie(c.sub, dto);
  }

  @Post('address') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Upload address document' })
  uploadAddress(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.uploadAddress(c.sub, dto);
  }

  @Post('police') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Upload police verification' })
  uploadPolice(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.kycService.uploadPolice(c.sub, dto);
  }
}
