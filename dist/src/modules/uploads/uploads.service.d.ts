import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class UploadsService {
    private prisma;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    uploadFile(companionId: string, file: Express.Multer.File, category: 'profile_photo' | 'gallery' | 'kyc_identity' | 'kyc_selfie' | 'kyc_address' | 'kyc_police' | 'evidence'): Promise<{
        url: string;
        key: string;
        size: number;
        mimeType: string;
    }>;
    addGalleryPhoto(companionId: string, url: string): Promise<{
        galleryPhotos: string[];
    }>;
    deleteGalleryPhoto(companionId: string, photoId: string): Promise<{
        message: string;
    }>;
    private uploadToS3;
    private saveLocally;
}
