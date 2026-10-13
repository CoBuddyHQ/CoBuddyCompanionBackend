-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'published', 'edit_rejected');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('not_started', 'in_progress', 'pending_review', 'approved', 'rejected', 'resubmit_required');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended', 'deactivated', 'deleted');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('new', 'building', 'trusted', 'highly_trusted');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('upcoming', 'pre_arrival', 'checked_in', 'active', 'extending', 'completed', 'cancelled', 'no_show', 'disputed');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired', 'counter_proposed', 'cancelled');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('session_earning', 'extension_earning', 'safety_bonus', 'platform_fee', 'refund_deduction', 'cancellation_penalty', 'payout_transfer');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending_review', 'approved', 'payout_eligible', 'paid', 'deducted', 'on_hold');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('idle', 'requested', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('cafe_conversation', 'city_walk', 'art_culture', 'food_experience', 'shopping_assistance', 'events', 'business_networking', 'bookstore', 'wellness_walk', 'movies');

-- CreateEnum
CREATE TYPE "TimerStatus" AS ENUM ('idle', 'active', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('request', 'session', 'safety', 'payout', 'support', 'policy', 'training', 'system');

-- CreateTable
CREATE TABLE "companions" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT '+91',
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "displayName" TEXT,
    "tagline" TEXT,
    "gender" TEXT,
    "city" TEXT,
    "willingToTravel" BOOLEAN NOT NULL DEFAULT true,
    "travelRadius" INTEGER NOT NULL DEFAULT 10,
    "bio" TEXT,
    "interestTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workPreferences" JSONB,
    "commActivityPrefs" JSONB,
    "venuePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "boundariesAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "photoUrl" TEXT,
    "hourlyRate" DECIMAL(10,2),
    "sessionDuration" INTEGER NOT NULL DEFAULT 90,
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'draft',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'not_started',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'active',
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "trustLevel" "TrustLevel" NOT NULL DEFAULT 'new',
    "rating" DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "responseRate" INTEGER NOT NULL DEFAULT 100,
    "cancellationRate" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_settings" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "notificationPrefs" JSONB NOT NULL DEFAULT '{}',
    "showAge" BOOLEAN NOT NULL DEFAULT true,
    "allowPromo" BOOLEAN NOT NULL DEFAULT false,
    "showInSearch" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'en',
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "safetyRulesAccepted" BOOLEAN NOT NULL DEFAULT false,
    "locationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "locationTracking" BOOLEAN NOT NULL DEFAULT true,
    "autoCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "disguisedCall" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_sessions" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_pins" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "biometricsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_biometrics" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_biometrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_service_areas" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "companion_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_categories" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "category" "Category" NOT NULL,

    CONSTRAINT "companion_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_languages" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL DEFAULT 'fluent',

    CONSTRAINT "companion_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_photos" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_kyc" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "legalFirstName" TEXT,
    "legalLastName" TEXT,
    "identityDocumentType" TEXT,
    "identityDocumentUrl" TEXT,
    "identityDocumentBackUrl" TEXT,
    "identitySubmittedAt" TIMESTAMP(3),
    "selfieImageUrl" TEXT,
    "selfieVideoUrl" TEXT,
    "selfieSubmittedAt" TIMESTAMP(3),
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressPinCode" TEXT,
    "addressType" TEXT,
    "addressIdMatch" BOOLEAN NOT NULL DEFAULT false,
    "addressDocumentType" TEXT,
    "addressDocumentUrl" TEXT,
    "addressSubmittedAt" TIMESTAMP(3),
    "policeVerificationUrl" TEXT,
    "maskedPan" TEXT,
    "panName" TEXT,
    "taxResidency" TEXT,
    "hasGST" BOOLEAN NOT NULL DEFAULT false,
    "gstNumber" TEXT,
    "bankHolderName" TEXT,
    "maskedBankAccount" TEXT,
    "bankIfsc" TEXT,
    "bankAccountType" TEXT,
    "bankName" TEXT,
    "bankVerified" BOOLEAN NOT NULL DEFAULT false,
    "maskedUpi" TEXT,
    "upiPayoutLabel" TEXT,
    "upiIsPrimary" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContactName" TEXT,
    "emergencyContactMaskedPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "declarationAgreedAt" TIMESTAMP(3),
    "declarationConsents" JSONB,
    "draftStage" TEXT,
    "draftData" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "razorpayFundAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "category" "Category" NOT NULL,
    "customerInitials" TEXT NOT NULL,
    "customerTrustScore" INTEGER NOT NULL DEFAULT 0,
    "customerVerified" BOOLEAN NOT NULL DEFAULT false,
    "customerSessionCount" INTEGER NOT NULL DEFAULT 0,
    "customerSafetyConsent" BOOLEAN NOT NULL DEFAULT false,
    "customerIdentityVerified" BOOLEAN NOT NULL DEFAULT false,
    "venueId" TEXT,
    "venueName" TEXT NOT NULL,
    "venueArea" TEXT NOT NULL,
    "venueCity" TEXT NOT NULL,
    "venueType" TEXT NOT NULL DEFAULT 'PUBLIC',
    "venueMeetingPoint" TEXT,
    "venueLandmark" TEXT,
    "isVenueApproved" BOOLEAN NOT NULL DEFAULT true,
    "proposedStart" TIMESTAMP(3) NOT NULL,
    "proposedEnd" TIMESTAMP(3) NOT NULL,
    "counterProposedStart" TIMESTAMP(3),
    "counterProposedEnd" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'Hindi',
    "estimatedEarning" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "customerNote" TEXT,
    "declineReason" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestId" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'upcoming',
    "category" "Category" NOT NULL,
    "customerInitials" TEXT NOT NULL,
    "customerTrustScore" INTEGER NOT NULL DEFAULT 0,
    "customerVerified" BOOLEAN NOT NULL DEFAULT false,
    "customerSessionCount" INTEGER NOT NULL DEFAULT 0,
    "customerSafetyConsent" BOOLEAN NOT NULL DEFAULT false,
    "customerIdentityVerified" BOOLEAN NOT NULL DEFAULT false,
    "venueId" TEXT,
    "venueName" TEXT NOT NULL,
    "venueArea" TEXT NOT NULL,
    "venueCity" TEXT NOT NULL,
    "venueType" TEXT NOT NULL DEFAULT 'PUBLIC',
    "venueMeetingPoint" TEXT,
    "venueLandmark" TEXT,
    "isVenueApproved" BOOLEAN NOT NULL DEFAULT true,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'Hindi',
    "baseEarning" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonusEarning" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estimatedTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "confirmedEarning" DECIMAL(10,2),
    "sessionPassCode" TEXT,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "cancelledBy" TEXT,
    "noShowAt" TIMESTAMP(3),
    "safetyTimerActive" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "customerRating" INTEGER,
    "customerFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings_transactions" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "sessionId" TEXT,
    "payoutId" TEXT,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "customerInitials" TEXT,
    "description" TEXT NOT NULL,
    "payoutEligibleAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earnings_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_records" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'requested',
    "amount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maskedBank" TEXT NOT NULL,
    "utrNumber" TEXT,
    "razorpayPayoutId" TEXT,
    "failureReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "razorpay_orders" (
    "id" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "requestId" TEXT,
    "companionId" TEXT NOT NULL,
    "amountPaisa" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_events" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "sessionId" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_timers" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "sessionId" TEXT,
    "status" "TimerStatus" NOT NULL DEFAULT 'active',
    "durationMinutes" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastCheckinAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trusted_contacts" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "maskedPhone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isEmergencyContact" BOOLEAN NOT NULL DEFAULT false,
    "shareLocation" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trusted_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_customers" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_reports" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "sessionId" TEXT,
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_reviews" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerInitials" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "comment" TEXT,
    "sessionCategory" "Category" NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "replyText" TEXT,
    "isReported" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_badges" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "badgeName" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_tasks" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "sessionId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "customerName" TEXT,
    "amount" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "sender" TEXT NOT NULL DEFAULT 'me',
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_timeline_events" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT[],
    "updatedDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "data" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_schedules" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "times" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_overrides" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "fullDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_slots" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "repeat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacation_modes" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "awayFrom" TEXT,
    "returnOn" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacation_modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_modules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "takeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_completions" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "moduleId" TEXT,
    "moduleName" TEXT NOT NULL DEFAULT 'onboarding',
    "screenName" TEXT,
    "stepName" TEXT,
    "completionStatus" TEXT NOT NULL DEFAULT 'completed',
    "score" INTEGER NOT NULL DEFAULT 0,
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "lastScreen" TEXT,
    "lastAction" TEXT,
    "resumePosition" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companions_phone_key" ON "companions"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "companions_email_key" ON "companions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companion_settings_companionId_key" ON "companion_settings"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "companion_pins_companionId_key" ON "companion_pins"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_biometrics_companionId_deviceId_key" ON "companion_biometrics"("companionId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_categories_companionId_category_key" ON "companion_categories"("companionId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "companion_languages_companionId_language_key" ON "companion_languages"("companionId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "companion_kyc_companionId_key" ON "companion_kyc"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_requestId_key" ON "sessions"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_orders_razorpayOrderId_key" ON "razorpay_orders"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "safety_timers_companionId_key" ON "safety_timers"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_customers_companionId_customerId_key" ON "blocked_customers"("companionId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_reviews_sessionId_key" ON "companion_reviews"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_badges_companionId_badgeKey_key" ON "companion_badges"("companionId", "badgeKey");

-- CreateIndex
CREATE INDEX "notifications_companionId_isRead_idx" ON "notifications"("companionId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_companionId_deviceId_key" ON "push_tokens"("companionId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_schedules_companionId_day_key" ON "weekly_schedules"("companionId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "vacation_modes_companionId_key" ON "vacation_modes"("companionId");

-- CreateIndex
CREATE INDEX "module_completions_companionId_idx" ON "module_completions"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_key_key" ON "uploaded_files"("key");

-- AddForeignKey
ALTER TABLE "companion_settings" ADD CONSTRAINT "companion_settings_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_pins" ADD CONSTRAINT "companion_pins_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_biometrics" ADD CONSTRAINT "companion_biometrics_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_service_areas" ADD CONSTRAINT "companion_service_areas_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_categories" ADD CONSTRAINT "companion_categories_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_languages" ADD CONSTRAINT "companion_languages_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_photos" ADD CONSTRAINT "companion_photos_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_kyc" ADD CONSTRAINT "companion_kyc_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "booking_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings_transactions" ADD CONSTRAINT "earnings_transactions_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings_transactions" ADD CONSTRAINT "earnings_transactions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_records" ADD CONSTRAINT "payout_records_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_timers" ADD CONSTRAINT "safety_timers_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_customers" ADD CONSTRAINT "blocked_customers_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_reviews" ADD CONSTRAINT "companion_reviews_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_badges" ADD CONSTRAINT "companion_badges_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_tasks" ADD CONSTRAINT "trust_tasks_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_timeline_events" ADD CONSTRAINT "dispute_timeline_events_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_schedules" ADD CONSTRAINT "weekly_schedules_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_overrides" ADD CONSTRAINT "date_overrides_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_slots" ADD CONSTRAINT "custom_slots_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacation_modes" ADD CONSTRAINT "vacation_modes_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_completions" ADD CONSTRAINT "module_completions_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_completions" ADD CONSTRAINT "module_completions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

