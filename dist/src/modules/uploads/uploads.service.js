"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
let UploadsService = UploadsService_1 = class UploadsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(UploadsService_1.name);
    }
    async uploadFile(companionId, file, category) {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, MP4, MOV, PDF');
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('File too large. Maximum size is 10MB');
        }
        const ext = path.extname(file.originalname).toLowerCase();
        const fileKey = `companions/${companionId}/${category}/${crypto.randomBytes(16).toString('hex')}${ext}`;
        let url;
        if (this.config.get('AWS_ACCESS_KEY_ID') && this.config.get('AWS_SECRET_ACCESS_KEY')) {
            url = await this.uploadToS3(file, fileKey);
        }
        else {
            url = await this.saveLocally(file, fileKey);
        }
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
    async addGalleryPhoto(companionId, url) {
        const count = await this.prisma.companionPhoto.count({ where: { companionId } });
        if (count >= 9)
            throw new common_1.BadRequestException('Maximum 9 gallery photos allowed');
        await this.prisma.companionPhoto.create({
            data: { companionId, url, sortOrder: count },
        });
        const photos = await this.prisma.companionPhoto.findMany({
            where: { companionId },
            orderBy: { sortOrder: 'asc' },
        });
        return { galleryPhotos: photos.map(p => p.url) };
    }
    async deleteGalleryPhoto(companionId, photoId) {
        await this.prisma.companionPhoto.deleteMany({
            where: { id: photoId, companionId },
        });
        return { message: 'Photo deleted' };
    }
    async uploadToS3(file, key) {
        const { S3Client, PutObjectCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-s3')));
        const s3 = new S3Client({
            region: this.config.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
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
    async saveLocally(file, key) {
        const uploadDir = path.join(process.cwd(), 'uploads', path.dirname(key));
        if (!fs.existsSync(uploadDir))
            fs.mkdirSync(uploadDir, { recursive: true });
        const filePath = path.join(process.cwd(), 'uploads', key);
        fs.writeFileSync(filePath, file.buffer);
        const port = this.config.get('PORT') || 4001;
        return `http://localhost:${port}/uploads/${key}`;
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map