import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Handles file upload. In production: uploads to S3 and returns CDN URL.
   * In development: saves to local /uploads directory and returns local URL.
   */
  async uploadFile(
    companionId: string,
    file: Express.Multer.File,
    category: 'profile_photo' | 'gallery' | 'kyc_identity' | 'kyc_selfie' | 'kyc_address' | 'kyc_police' | 'evidence',
  ): Promise<{ url: string; key: string; size: number; mimeType: string }> {
    if (!file) throw new BadRequestException('No file provided');

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, MP4, MOV, PDF');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 10MB');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const fileKey = `companions/${companionId}/${category}/${crypto.randomBytes(16).toString('hex')}${ext}`;

    let url: string;

    if (this.config.get('AWS_ACCESS_KEY_ID') && this.config.get('AWS_SECRET_ACCESS_KEY')) {
      // Production: upload to S3
      url = await this.uploadToS3(file, fileKey);
    } else {
      // Development: save locally
      url = await this.saveLocally(file, fileKey);
    }

    // Track upload in DB
    await this.prisma.uploadedFile.create({
      data: {
        companionId,
        url,
        key: fileKey,
        category,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    this.logger.log(`File uploaded: ${fileKey} (${category}) — ${file.size} bytes`);

    return {
      url,
      key: fileKey,
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

  async deleteGalleryPhoto(companionId: string, photoId: string) {
    await this.prisma.companionPhoto.deleteMany({
      where: { id: photoId, companionId },
    });
    return { message: 'Photo deleted' };
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
    const port = this.config.get('PORT') || 4001;
    return `http://localhost:${port}/uploads/${key}`;
  }
}
