export declare class ProfileSetupBulkDto {
    bio?: string;
    interestTags?: string[];
    categories?: string[];
    languages?: string[];
}
export declare class UpdateBasicProfileDto {
    displayName?: string;
    tagline?: string;
    gender?: string;
    bio?: string;
    city?: string;
}
export declare class UpdateBioDto {
    bio?: string;
}
export declare class UpdateCategoriesDto {
    categories?: string[];
}
export declare class UpdateLanguagesDto {
    languages?: string[];
}
export declare class UpdateWorkPreferenceDto {
    durations?: any;
    days?: any;
    timeRanges?: any;
    frequency?: any;
}
export declare class UpdateServiceAreasDto {
    city?: string;
    serviceAreas?: string[];
    willingToTravel?: boolean;
    travelRadius?: number;
}
export declare class UpdatePricingDto {
    hourlyRate?: number;
    sessionDuration?: number;
}
export declare class UpdateCommActivityDto {
    interests?: string[];
    interestTags?: string[];
    commStyle?: string;
    activityPace?: string;
    groupPreference?: string;
    accessibilityNote?: string;
}
export declare class UpdateInterestsDto {
    interests?: string[];
    interestTags?: string[];
}
export declare class UpdateVenuesDto {
    venuePreferences?: string[];
}
export declare class UpdateBoundariesDto {
    boundariesAccepted: boolean;
}
export declare class UpdatePhotoDto {
    photoUrl?: string;
}
export declare class UpdatePhotosDto {
    photoUrl?: string;
    galleryPhotos?: string[];
}
export declare class ReorderPhotosDto {
    photoIds: string[];
}
export declare class ToggleAvailabilityDto {
    isAvailable: boolean;
    isOnline?: boolean;
}
