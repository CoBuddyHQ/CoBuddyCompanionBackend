import { UploadsService } from './uploads.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ProfileService } from '../profile/profile.service';
export declare class UploadsController {
    private readonly uploadsService;
    private readonly profileService;
    constructor(uploadsService: UploadsService, profileService: ProfileService);
    uploadProfilePhoto(c: JwtPayload, file: Express.Multer.File): Promise<{
        photoUrl: string;
        profile: {
            companionId: any;
            displayName: any;
            tagline: any;
            maskedPhone: string;
            city: any;
            serviceAreas: any;
            categories: any;
            languages: any;
            bio: any;
            hourlyRate: number;
            sessionDuration: any;
            profileStatus: string;
            verificationStatus: string;
            trustScore: any;
            trustLevel: string;
            rating: number;
            totalReviews: any;
            totalSessions: any;
            isAvailable: any;
            isOnline: any;
            photoUrl: any;
            joinedAt: string;
            onboardingStatus: import("../kyc/progress-engine.service").OnboardingStatus;
            completedModules: string[];
            pendingModules: string[];
            resumeRoute: string;
        };
        onboardingStatus: any;
        message: string;
    }>;
    uploadGalleryPhoto(c: JwtPayload, file: Express.Multer.File): Promise<{
        galleryPhotos: string[];
    }>;
    deleteGalleryPhoto(c: JwtPayload, photoId: string): Promise<{
        message: string;
    }>;
    uploadKycIdentity(c: JwtPayload, file: Express.Multer.File): Promise<{
        url: string;
        key: string;
        size: number;
        mimeType: string;
    }>;
    uploadKycSelfie(c: JwtPayload, file: Express.Multer.File): Promise<{
        url: string;
        key: string;
        size: number;
        mimeType: string;
    }>;
    uploadKycAddress(c: JwtPayload, file: Express.Multer.File): Promise<{
        url: string;
        key: string;
        size: number;
        mimeType: string;
    }>;
    uploadKycPolice(c: JwtPayload, file: Express.Multer.File): Promise<{
        url: string;
        key: string;
        size: number;
        mimeType: string;
    }>;
    uploadKycPan(c: JwtPayload, file: Express.Multer.File): Promise<{
        url: string;
        key: string;
        size: number;
        mimeType: string;
    }>;
    uploadKycBank(c: JwtPayload, file: Express.Multer.File): Promise<{
        url: string;
        key: string;
        size: number;
        mimeType: string;
    }>;
    uploadEvidence(c: JwtPayload, file: Express.Multer.File): Promise<{
        url: string;
        key: string;
        size: number;
        mimeType: string;
    }>;
}
