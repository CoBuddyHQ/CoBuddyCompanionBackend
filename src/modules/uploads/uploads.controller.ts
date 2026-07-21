import {
  Controller, Post, Delete, Body, Param, UseGuards,
  UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { memoryStorage } from 'multer';
import { ProfileService } from '../profile/profile.service';

const upload = memoryStorage();

@ApiTags('Uploads')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly profileService: ProfileService,
  ) {}

  /**
   * POST /companion/uploads/profile-photo — Endpoints.UPLOADS.PROFILE_PHOTO
   * Multipart/form-data with file field "photo"
   */
  @Post('profile-photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo', { storage: upload }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile photo — Endpoints.UPLOADS.PROFILE_PHOTO' })
  @ApiBody({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } } })
  async uploadProfilePhoto(
    @CurrentCompanion() c: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadsService.uploadFile(c.sub, file, 'profile_photo');
    await this.profileService.updatePhotos(c.sub, { photoUrl: result.url });
    return { photoUrl: result.url, message: 'Profile photo updated successfully' };
  }

  /**
   * POST /companion/uploads/gallery — Endpoints.UPLOADS.GALLERY_PHOTO
   */
  @Post('gallery')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo', { storage: upload }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload gallery photo — Endpoints.UPLOADS.GALLERY_PHOTO' })
  @ApiBody({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } } })
  async uploadGalleryPhoto(
    @CurrentCompanion() c: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadsService.uploadFile(c.sub, file, 'gallery');
    return this.uploadsService.addGalleryPhoto(c.sub, result.url);
  }

  /**
   * DELETE /companion/uploads/gallery/:photoId — Endpoints.UPLOADS.DELETE_PHOTO
   */
  @Delete('gallery/:photoId')
  @ApiOperation({ summary: 'Delete gallery photo — Endpoints.UPLOADS.DELETE_PHOTO' })
  deleteGalleryPhoto(@CurrentCompanion() c: JwtPayload, @Param('photoId') photoId: string) {
    return this.uploadsService.deleteGalleryPhoto(c.sub, photoId);
  }

  /**
   * POST /companion/uploads/kyc/identity — Endpoints.UPLOADS.KYC_IDENTITY
   */
  @Post('kyc/identity')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('document', { storage: upload }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload KYC identity document' })
  async uploadKycIdentity(@CurrentCompanion() c: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(c.sub, file, 'kyc_identity');
  }

  /**
   * POST /companion/uploads/kyc/selfie — Endpoints.UPLOADS.KYC_SELFIE
   */
  @Post('kyc/selfie')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('video', { storage: upload }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload KYC selfie video' })
  async uploadKycSelfie(@CurrentCompanion() c: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(c.sub, file, 'kyc_selfie');
  }

  /**
   * POST /companion/uploads/kyc/address — Endpoints.UPLOADS.KYC_ADDRESS
   */
  @Post('kyc/address')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('document', { storage: upload }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload KYC address document' })
  async uploadKycAddress(@CurrentCompanion() c: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(c.sub, file, 'kyc_address');
  }

  /**
   * POST /companion/uploads/kyc/police — Endpoints.UPLOADS.KYC_POLICE
   */
  @Post('kyc/police')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('document', { storage: upload }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload police verification certificate' })
  async uploadKycPolice(@CurrentCompanion() c: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(c.sub, file, 'kyc_police');
  }

  /**
   * POST /companion/uploads/evidence — Endpoints.UPLOADS.EVIDENCE
   */
  @Post('evidence')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { storage: upload }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload incident/dispute evidence file' })
  async uploadEvidence(@CurrentCompanion() c: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(c.sub, file, 'evidence');
  }
}
