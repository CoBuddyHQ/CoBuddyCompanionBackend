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
export declare class SaveAddressDto {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pinCode: string;
    addressType?: string;
    idMatch?: boolean;
    addressDocumentType?: string;
    addressDocumentUrl?: string;
}
export declare class SavePanDto {
    panName: string;
    maskedPan: string;
    taxResidency?: string;
    hasGST?: boolean;
    gstNumber?: string;
}
export declare class SaveBankDto {
    holderName: string;
    maskedAccount: string;
    ifsc: string;
    accountType: string;
    bankName: string;
}
export declare class VerifyBankDto {
    bankId: string;
}
export declare class SaveUpiDto {
    maskedUpi: string;
    payoutLabel?: string;
    isPrimary?: boolean;
}
