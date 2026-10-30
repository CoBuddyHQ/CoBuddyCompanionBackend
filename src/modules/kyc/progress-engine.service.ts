import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface OnboardingStatus {
  profile: any;
  completedModules: string[];
  pendingModules: string[];
  completedSteps: string[];
  currentStep: string;
  nextStep: string;
  profileCompletion: number;
  resumeScreen: string;
  resumeRoute: string;
  draftStatus: string;
  verificationStatus: string;
  applicationStatus: string;
  lastUpdated: string;
  hasStarted: boolean;   // true when completedModules.length > 0
  termsAccepted: boolean;
  termsAcceptedAt?: string | null;
}

@Injectable()
export class ProgressEngineService {
  constructor(private prisma: PrismaService) {}

  // List of all required modules in logical linear order
  private readonly MODULES = [
    { id: 'eligibility', route: 'CPN_022_EligibilityConfirmation' },
    { id: 'basic_details', route: 'CPN_023_BasicDetails' },
    { id: 'bio', route: 'CPN_024_BioIntroduction' },
    { id: 'interests', route: 'CPN_027_InterestsPersonality' },
    { id: 'categories', route: 'CPN_026_ExperienceCategories' },
    { id: 'languages', route: 'CPN_034_LanguagesSelection' },
    { id: 'photo', route: 'CPN_035_ProfilePhotoUpload' },
    { id: 'declaration', route: 'CPN_025_BackgroundDeclaration' },
    { id: 'work_preference', route: 'CPN_028_WorkPreference' },
    { id: 'service_area', route: 'CPN_029_CityServiceArea' },
    { id: 'service_style', route: 'CPN_030_ServiceStylePreferences' },
    { id: 'public_venue', route: 'CPN_031_PublicVenuePreference' },
    { id: 'boundaries', route: 'CPN_032_BoundariesSafety' },
    { id: 'government_id', route: 'CPN_036_GovernmentIDType' },
    { id: 'selfie', route: 'CPN_038_SelfieCapture' },
    { id: 'address', route: 'CPN_040_AddressVerification' },
    { id: 'pricing', route: 'CPN_033_CompanionPricing' },
    { id: 'pan', route: 'CPN_041_PANTaxDetails' },
    { id: 'bank', route: 'CPN_042_AddBankAccount' },
    { id: 'upi', route: 'CPN_044_UPIDetails' },
  ];

  async getOnboardingStatus(companionId: string): Promise<OnboardingStatus> {
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
      include: {
        categories: true,
        languages: true,
        galleryPhotos: true,
        serviceAreas: true,
      },
    });

    let kyc = await this.prisma.companionKYC.findUnique({
      where: { companionId },
    });

    if (!kyc) {
      kyc = await this.prisma.companionKYC.create({ data: { companionId } });
    }

    const completedModules: string[] = [];
    const pendingModules: string[] = [];

    // Evaluate each module based on ACTUAL db presence
    const checkModule = (id: string, isComplete: boolean) => {
      if (isComplete) completedModules.push(id);
      else pendingModules.push(id);
    };

    const consents = (kyc.declarationConsents as any) || {};

    // 1. Eligibility confirmation
    const isEligible = !!(consents.eligibilityConfirmed || companion?.termsAccepted || companion?.boundariesAccepted);
    checkModule('eligibility', isEligible);

    // 2. Basic details
    checkModule('basic_details', !!(companion?.dateOfBirth && companion?.gender && companion?.displayName));

    // 3. Bio introduction
    checkModule('bio', !!(companion?.bio && companion.bio.trim().length >= 50));

    // 4. Interests & personality
    checkModule('interests', !!(companion?.interestTags && companion.interestTags.length > 0));

    // 5. Experience categories
    checkModule('categories', !!(companion?.categories && companion.categories.length > 0));

    // 6. Spoken languages
    checkModule('languages', !!(companion?.languages && companion.languages.length > 0));

    // 7. Profile photo
    checkModule('photo', !!(companion?.photoUrl));

    // 8. Background declaration
    const isDeclarationDone = !!(kyc.declarationAgreedAt && (consents.noCriminalRecord !== undefined || consents.accurate_info !== undefined || Object.keys(consents).length >= 4));
    checkModule('declaration', isDeclarationDone);

    // 9. Work preferences
    const hasWorkPrefs = companion?.workPreferences && Object.keys(companion.workPreferences).length > 0;
    checkModule('work_preference', !!hasWorkPrefs);

    // 10. Service areas
    checkModule('service_area', !!(companion?.serviceAreas && companion.serviceAreas.length > 0));

    // 11. Communication & style preferences
    const hasCommPrefs = companion?.commActivityPrefs && Object.keys(companion.commActivityPrefs).length > 0;
    checkModule('service_style', !!hasCommPrefs);

    // 12. Public venue preferences
    checkModule('public_venue', !!(companion?.venuePreferences && companion.venuePreferences.length > 0));

    // 13. Boundaries & safety rules
    checkModule('boundaries', !!(companion?.boundariesAccepted));

    // 14. Government ID (Aadhaar / Passport / etc.)
    checkModule('government_id', !!(kyc.identityDocumentUrl || kyc.identitySubmittedAt));

    // 15. Selfie & liveness
    checkModule('selfie', !!((kyc.selfieImageUrl || kyc.selfieSubmittedAt) && kyc.selfieVideoUrl));

    // 16. Residential address
    checkModule('address', !!(kyc.addressDocumentUrl || kyc.addressSubmittedAt || (kyc.addressLine1 && kyc.addressCity)));

    // 17. Companion pricing
    checkModule('pricing', !!(companion?.hourlyRate && Number(companion.hourlyRate) > 0));

    // 18. PAN Tax details
    checkModule('pan', !!(kyc.maskedPan));

    // 19. Bank account verification
    checkModule('bank', !!(kyc.maskedBankAccount && kyc.bankVerified));

    // 20. UPI (optional, never blocks progress)
    checkModule('upi', true);

    const mandatoryModulesCount = this.MODULES.filter(m => m.id !== 'upi').length;
    const completedMandatoryCount = completedModules.filter(m => m !== 'upi').length;
    const profileCompletion = Math.min(100, Math.round((completedMandatoryCount / mandatoryModulesCount) * 100));

    // Find the first pending module to set as resume step
    const firstPendingId = this.MODULES.find(m => pendingModules.includes(m.id))?.id || null;
    const resumeModuleDef = this.MODULES.find(m => m.id === firstPendingId) || { route: 'CPN_048_ApplicationReviewInfo' };

    let resumeRoute = resumeModuleDef.route;
    if (firstPendingId === 'government_id' && kyc.identityDocumentType && !kyc.identityDocumentUrl) {
      resumeRoute = 'CPN_037_GovernmentIDUpload';
    } else if (firstPendingId === 'selfie' && (kyc.selfieImageUrl || kyc.selfieSubmittedAt) && !kyc.selfieVideoUrl) {
      resumeRoute = 'CPN_039_LivenessDetection';
    } else if (firstPendingId === 'bank' && kyc.maskedBankAccount && !kyc.bankVerified) {
      resumeRoute = 'CPN_043_BankAccountVerification';
    }

    const currentStep = firstPendingId || 'completed';
    const currIdx = this.MODULES.findIndex(m => m.id === currentStep);
    const nextStep = (currIdx >= 0 && currIdx < this.MODULES.length - 1) ? this.MODULES[currIdx + 1].id : 'done';

    const actualProfileStatus = companion?.profileStatus || 'draft';
    const isSubmitted = actualProfileStatus === 'submitted' || actualProfileStatus === 'under_review' || actualProfileStatus === 'published';

    return {
      profile: companion,
      completedModules,
      pendingModules,
      completedSteps: completedModules,
      currentStep,
      nextStep,
      profileCompletion,
      resumeScreen: resumeRoute,
      resumeRoute: resumeRoute,
      draftStatus: actualProfileStatus,
      verificationStatus: companion?.verificationStatus || 'not_started',
      applicationStatus: isSubmitted ? actualProfileStatus : 'draft',
      lastUpdated: new Date().toISOString(),
      hasStarted: completedModules.length > 0,
      termsAccepted: companion?.termsAccepted ?? false,
      termsAcceptedAt: companion?.termsAcceptedAt?.toISOString() ?? null,
    };
  }
}
