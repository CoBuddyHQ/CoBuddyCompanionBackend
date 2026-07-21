export declare class BasicDetailsDto {
    legalFirstName?: string;
    legalLastName?: string;
    displayName?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
}
export declare class SaveDeclarationDto {
    accurateInfo?: boolean;
    publicVenueOnly?: boolean;
    professionalConduct?: boolean;
    noPrivateContact?: boolean;
    safetyPolicy?: boolean;
    noMisrepresentation?: boolean;
    agreedAt?: string;
}
export declare class UpdateGovernmentIdTypeDto {
    documentType: string;
}
export declare class SubmitGovernmentIdDto {
    documentType: string;
    frontUrl: string;
    backUrl?: string;
}
export declare class SubmitSelfieDto {
    imageUrl: string;
    videoUrl?: string;
}
