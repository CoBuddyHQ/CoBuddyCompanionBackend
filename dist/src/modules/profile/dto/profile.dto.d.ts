export declare class UpdateBasicProfileDto {
    displayName?: string;
    city?: string;
}
export declare class UpdateBioDto {
    bio?: string;
}
export declare class UpdateCategoriesDto {
    categories?: string[];
}
export declare class UpdateLanguagesDto {
    languages?: {
        language: string;
        proficiency?: string;
    }[];
}
export declare class UpdateServiceAreasDto {
    serviceAreas?: {
        area: string;
        city: string;
    }[];
}
export declare class UpdatePricingDto {
    hourlyRate?: number;
}
export declare class UpdatePhotoDto {
    photoUrl?: string;
}
export declare class ReorderPhotosDto {
    photoIds: string[];
}
export declare class ToggleAvailabilityDto {
    isAvailable: boolean;
    isOnline?: boolean;
}
