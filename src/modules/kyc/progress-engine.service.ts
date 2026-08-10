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
}

@Injectable()
export class ProgressEngineService {
  constructor(private prisma: PrismaService) {}

  // List of all required modules in logical linear order
  private readonly MODULES = [
    { id: 'basic_details', route: 'CPN_023_BasicDetails' },
    { id: 'bio', route: 'CPN_024_BioIntroduction' },
    { id: 'declaration', route: 'CPN_025_BackgroundDeclaration' },
    { id: 'categories', route: 'CPN_026_ExperienceCategories' },
    { id: 'interests', route: 'CPN_027_InterestsPersonality' },
    { id: 'work_preference', route: 'CPN_028_WorkPreference' },
    { id: 'service_area', route: 'CPN_029_CityServiceArea' },
    { id: 'service_style', route: 'CPN_030_ServiceStylePreferences' },
    { id: 'public_venue', route: 'CPN_031_PublicVenuePreference' },
    { id: 'boundaries', route: 'CPN_032_BoundariesSafety' },
    { id: 'pricing', route: 'CPN_033_CompanionPricing' },
    { id: 'languages', route: 'CPN_034_LanguagesSelection' },
    { id: 'photo', route: 'CPN_035_ProfilePhotoUpload' },
    { id: 'government_id', route: 'CPN_036_GovernmentIDType' },
    { id: 'selfie', route: 'CPN_038_SelfieCapture' },
    { id: 'address', route: 'CPN_040_AddressVerification' },
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

    // basic_details: need dob, gender, name
    checkModule('basic_details', !!(companion?.dateOfBirth && companion?.gender && companion?.displayName));
    checkModule('bio', !!(companion?.bio && companion.bio.length > 0));
    checkModule('declaration', !!(kyc.declarationAgreedAt));
    checkModule('categories', !!(companion?.categories && companion.categories.length > 0));
    checkModule('interests', !!(companion?.interestTags && companion.interestTags.length > 0));
    
    // Check if workPreferences JSON is not null and has keys
    const hasWorkPrefs = companion?.workPreferences && Object.keys(companion.workPreferences).length > 0;
    checkModule('work_preference', !!hasWorkPrefs);
    
    checkModule('service_area', !!(companion?.serviceAreas && companion.serviceAreas.length > 0));
    
    const hasCommPrefs = companion?.commActivityPrefs && Object.keys(companion.commActivityPrefs).length > 0;
    checkModule('service_style', !!hasCommPrefs);
    
    checkModule('public_venue', !!(companion?.venuePreferences && companion.venuePreferences.length > 0));
    checkModule('boundaries', !!(companion?.boundariesAccepted));
    checkModule('pricing', !!(companion?.hourlyRate));
    checkModule('languages', !!(companion?.languages && companion.languages.length > 0));
    checkModule('photo', !!(companion?.photoUrl));
    
    checkModule('government_id', !!(kyc.identityDocumentUrl || kyc.identitySubmittedAt));
    checkModule('selfie', !!(kyc.selfieVideoUrl || kyc.selfieSubmittedAt));
    checkModule('address', !!(kyc.addressDocumentUrl || kyc.addressSubmittedAt || kyc.addressLine1));
    checkModule('pan', !!(kyc.maskedPan));
    checkModule('bank', !!(kyc.maskedBankAccount));
    checkModule('upi', !!(kyc.maskedUpi));

    const profileCompletion = Math.round((completedModules.length / this.MODULES.length) * 100);

    // Find the first pending module to set as resume step
    const firstPendingId = this.MODULES.find(m => pendingModules.includes(m.id))?.id || null;
    const resumeModuleDef = this.MODULES.find(m => m.id === firstPendingId) || { route: 'CPN_051_VerificationHub' };

    const currentStep = firstPendingId || 'completed';
    // Find next step after current
    const currIdx = this.MODULES.findIndex(m => m.id === currentStep);
    const nextStep = (currIdx >= 0 && currIdx < this.MODULES.length - 1) ? this.MODULES[currIdx + 1].id : 'done';

    return {
      profile: companion,
      completedModules,
      pendingModules,
      completedSteps: completedModules,
      currentStep,
      nextStep,
      profileCompletion,
      resumeScreen: resumeModuleDef.route,
      resumeRoute: resumeModuleDef.route,
      draftStatus: companion?.profileStatus || 'draft',
      verificationStatus: companion?.verificationStatus || 'not_started',
      applicationStatus: companion?.profileStatus || 'pending',
      lastUpdated: new Date().toISOString()
    };
  }
}
