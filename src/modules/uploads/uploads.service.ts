import { Injectable, BadRequestException, NotFoundException, ServiceUnavailableException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { validateUpload } from '../../common/utils/upload-content.util';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private isCloudinaryConfigured = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET');
    if (cloudName && apiKey && apiSecret && apiSecret !== 'YOUR_API_SECRET') {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isCloudinaryConfigured = true;
      this.logger.log(`Cloudinary configured for ${cloudName}`);
    }
  }

  /**
   * Handles file upload. In production: uploads to S3 or Cloudinary and returns CDN URL.
   * In development: saves to local /uploads directory and returns local URL.
   */
  async uploadFile(
    companionId: string,
    file: Express.Multer.File,
    category: 'profile_photo' | 'gallery' | 'kyc_identity' | 'kyc_selfie' | 'kyc_address' | 'kyc_police' | 'evidence',
  ): Promise<{ url: string; key: string; size: number; mimeType: string }> {
    if (!file) throw new BadRequestException('No file provided');
    const isPrivate = !['profile_photo', 'gallery'].includes(category);
    validateUpload(file, !isPrivate);
    if (isPrivate && this.config.get('NODE_ENV') === 'production') {
      throw new ServiceUnavailableException('Private document storage is not configured');
    }
    if (this.config.get('NODE_ENV') === 'production' && !this.isCloudinaryConfigured &&
      !(this.config.get('AWS_ACCESS_KEY_ID') && this.config.get('AWS_SECRET_ACCESS_KEY'))) {
      throw new ServiceUnavailableException('Persistent media storage is not configured');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4', '.mov'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, MP4, MOV, PDF');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(`Disallowed file extension (${ext}). Allowed: JPG, PNG, WEBP, PDF, MP4, MOV`);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 10MB');
    }

    // Verify magic bytes from file buffer to prevent MIME spoofing
    if (file.buffer) {
      const magicMap: { mime: string; bytes: number[]; offset?: number }[] = [
        { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
        { mime: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47] },
        { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
        { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
        { mime: 'video/mp4',  bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
        { mime: 'video/quicktime', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
      ];
      const match = magicMap.find(m => m.mime === file.mimetype || (file.mimetype === 'image/jpg' && m.mime === 'image/jpeg'));
      if (match) {
        const offset = match.offset ?? 0;
        let valid = file.buffer.length >= offset + match.bytes.length;
        if (valid) {
          for (let i = 0; i < match.bytes.length; i++) {
            if (file.buffer[offset + i] !== match.bytes[i]) {
              valid = false;
              break;
            }
          }
        }
        if (!valid) {
          throw new BadRequestException('File content does not match declared type. Upload rejected.');
        }
      }
    }

    const fileKey = `companions/${companionId}/${category}/${crypto.randomBytes(16).toString('hex')}${ext}`;
    
    let url: string;
    let finalKey = fileKey;
    const uploadId = crypto.randomUUID();

    if (isPrivate) {
      finalKey = `private/${fileKey}`;
      await this.saveLocally(file, finalKey);
      url = `/api/v1/companion/uploads/files/${uploadId}`;
    } else if (this.isCloudinaryConfigured) {
      const publicId = `cobuddy/companions/${companionId}/${category}/${crypto.randomBytes(16).toString('hex')}`;
      const uploadResult = await this.uploadToCloudinary(file, publicId);
      url = uploadResult.secure_url;
      finalKey = uploadResult.public_id;
    } else if (this.config.get('AWS_ACCESS_KEY_ID') && this.config.get('AWS_SECRET_ACCESS_KEY')) {
      url = await this.uploadToS3(file, fileKey);
    } else {
      const base = this.config.get<string>('PUBLIC_MEDIA_BASE_URL');
      if (!base || !/^https?:\/\//.test(base)) {
        throw new ServiceUnavailableException('PUBLIC_MEDIA_BASE_URL is required for local public uploads');
      }
      finalKey = `public/${fileKey}`;
      const relativeUrl = await this.saveLocally(file, finalKey);
      url = `${base.replace(/\/+$/, '')}${relativeUrl}`;
    }

    // Track upload in DB
    await this.prisma.uploadedFile.create({
      data: {
        id: uploadId,
        companionId,
        url,
        key: finalKey,
        category,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    this.logger.log(`File uploaded: ${finalKey} (${category}) — ${file.size} bytes`);

    return {
      url,
      key: finalKey,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async addGalleryPhoto(companionId: string, url: string) {
    const count = await this.prisma.companionPhoto.count({ where: { companionId } });
    if (count >= 9) throw new BadRequestException('Maximum 9 gallery photos allowed');

    await this.prisma.companionPhoto.create({
      data: { companionId, url, sortOrder: count },
    });

    const photos = await this.prisma.companionPhoto.findMany({
      where: { companionId },
      orderBy: { sortOrder: 'asc' },
    });

    return { galleryPhotos: photos.map(p => p.url) };
  }

  async streamPrivateFile(companionId: string, fileId: string, res: Response) {
    const record = await this.prisma.uploadedFile.findFirst({ where: { id: fileId, companionId } });
    if (!record || !record.key.startsWith('private/')) throw new NotFoundException('Document not found');
    const root = path.resolve(process.cwd(), 'uploads', 'private');
    const location = path.resolve(process.cwd(), 'uploads', record.key);
    if (!location.startsWith(root + path.sep) || !fs.existsSync(location)) throw new NotFoundException('Document not found');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Disposition', 'attachment');
    res.sendFile(location);
  }

  async deleteGalleryPhoto(companionId: string, photoId: string) {
    await this.prisma.companionPhoto.deleteMany({
      where: { id: photoId, companionId },
    });
    return { message: 'Photo deleted' };
  }

  private async uploadToCloudinary(file: Express.Multer.File, publicId: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  private async uploadToS3(file: Express.Multer.File, key: string): Promise<string> {
    // Lazy import AWS SDK only when needed
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: this.config.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY')!,
      },
    });
    await s3.send(new PutObjectCommand({
      Bucket: this.config.get('AWS_S3_BUCKET'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    const domain = this.config.get('CLOUDFRONT_DOMAIN') || `${this.config.get('AWS_S3_BUCKET')}.s3.amazonaws.com`;
    return `https://${domain}/${key}`;
  }

  private async saveLocally(file: Express.Multer.File, key: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', path.dirname(key));
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(process.cwd(), 'uploads', key);
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/${key}`;
  }
}
