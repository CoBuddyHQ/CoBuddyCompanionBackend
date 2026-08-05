"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
require("dotenv/config");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Seeding Database...');
    const companion = await prisma.companion.upsert({
        where: { phone: '9999992398' },
        update: {},
        create: {
            phone: '9999992398',
            countryCode: '+91',
            displayName: 'Test Companion',
            city: 'Mumbai',
            bio: 'Hi, I am a test companion created by the seeder script. I love exploring cafes and cities.',
            photoUrl: 'https://i.pravatar.cc/300',
            hourlyRate: 500.0,
            profileStatus: client_1.ProfileStatus.approved,
            verificationStatus: client_1.VerificationStatus.approved,
            accountStatus: client_1.AccountStatus.active,
            trustScore: 85,
            trustLevel: client_1.TrustLevel.building,
            rating: 4.8,
            totalReviews: 12,
            totalSessions: 15,
            isAvailable: true,
            isOnline: false,
        },
    });
    console.log('Created Companion:', companion.id);
    await prisma.companionSettings.deleteMany({ where: { companionId: companion.id } });
    await prisma.companionSettings.create({
        data: {
            companionId: companion.id,
            language: 'en',
            notificationPrefs: {
                new_booking_push: true,
                session_reminder_push: true,
                payout_email: true,
                marketing_email: false,
            },
            showAge: true,
            allowPromo: false,
            showInSearch: true,
        }
    });
    await prisma.companionKYC.upsert({
        where: { companionId: companion.id },
        update: {},
        create: {
            companionId: companion.id,
            identityDocumentType: 'AADHAAR',
            identityDocumentUrl: 'dummy-url-front',
            identityDocumentBackUrl: 'dummy-url-back',
        },
    });
    await prisma.companionPIN.upsert({
        where: { companionId: companion.id },
        update: {},
        create: {
            companionId: companion.id,
            pinHash: '$2b$10$XmO9jR/C.fL3J6I6sF1I..X7Z/xH00F5kYy9l8oQ4L7.P8w8.lT2O',
        },
    });
    await prisma.companionCategory.createMany({
        data: [
            { companionId: companion.id, category: client_1.Category.cafe_conversation },
            { companionId: companion.id, category: client_1.Category.city_walk },
        ],
        skipDuplicates: true,
    });
    await prisma.companionLanguage.createMany({
        data: [
            { companionId: companion.id, language: 'English', proficiency: 'Fluent' },
            { companionId: companion.id, language: 'Hindi', proficiency: 'Native' },
        ],
        skipDuplicates: true,
    });
    const module1 = await prisma.trainingModule.upsert({
        where: { id: 'mod_1_intro' },
        update: {},
        create: {
            id: 'mod_1_intro',
            title: 'Introduction to CoBuddy',
            duration: '15 mins',
            required: true,
            body: ['Learn the basics of being a great Companion.'],
            takeaways: ['Understand companion role and platform rules.'],
        },
    });
    const module2 = await prisma.trainingModule.upsert({
        where: { id: 'mod_2_safety' },
        update: {},
        create: {
            id: 'mod_2_safety',
            title: 'Safety Guidelines',
            duration: '20 mins',
            required: true,
            body: ['Crucial safety rules and emergency protocols.'],
            takeaways: ['Know how to use SOS and safety tools.'],
        },
    });
    const now = new Date();
    const todayAt740PM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 40, 0);
    const todayAt830PM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30, 0);
    await prisma.companion.update({
        where: { id: companion.id },
        data: {
            displayName: 'Arjun S.',
            tagline: 'Explorer & Food Enthusiast',
            city: 'Bhopal',
            bio: "Hi! I love showing people around the city's hidden gems, trying new cafés, and having real conversations about life, tech, and culture. Let's explore together!",
            rating: 4.8,
            totalSessions: 47,
            totalReviews: 24,
            verificationStatus: 'approved',
            interestTags: ['coffee', 'dining', 'music'],
            isAvailable: false,
        }
    });
    await prisma.companionPhoto.deleteMany({ where: { companionId: companion.id } });
    await prisma.companionPhoto.createMany({
        data: [
            { companionId: companion.id, url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a', sortOrder: 0 },
            { companionId: companion.id, url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352', sortOrder: 1 },
            { companionId: companion.id, url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', sortOrder: 2 },
        ]
    });
    await prisma.companionReview.deleteMany({ where: { companionId: companion.id } });
    await prisma.companionReview.createMany({
        data: [
            {
                companionId: companion.id,
                sessionId: `mock_sess_review_1_${Date.now()}`,
                customerInitials: 'Neha S.',
                rating: 5.0,
                comment: 'An amazing CoBuddy experience! We had a great time exploring the cafés. Super knowledgeable an...',
                sessionCategory: 'cafe_conversation',
                sessionDate: new Date('2026-06-25T10:00:00Z'),
            },
            {
                companionId: companion.id,
                sessionId: `mock_sess_review_2_${Date.now()}`,
                customerInitials: 'Aman K.',
                rating: 5.0,
                comment: 'Very polite and knowledgeable about the city. Made me feel safe and comfortable throughout.',
                sessionCategory: 'city_walk',
                sessionDate: new Date('2026-06-20T10:00:00Z'),
            }
        ]
    });
    await prisma.bookingRequest.createMany({
        data: [
            {
                companionId: companion.id,
                customerId: 'cust_mock_1',
                status: 'pending',
                category: 'cafe_conversation',
                customerInitials: 'JD',
                customerTrustScore: 90,
                customerVerified: true,
                customerSafetyConsent: true,
                venueName: 'Café Coffee Day',
                venueArea: 'MP Nagar',
                venueCity: 'Bhopal',
                proposedStart: todayAt740PM,
                proposedEnd: new Date(todayAt740PM.getTime() + 120 * 60000),
                durationMinutes: 120,
                estimatedEarning: 749.0,
                expiresAt: new Date(now.getTime() + 60 * 60000),
            },
            {
                companionId: companion.id,
                customerId: 'cust_mock_2',
                status: 'pending',
                category: 'city_walk',
                customerInitials: 'MK',
                customerTrustScore: 85,
                customerVerified: true,
                customerSafetyConsent: true,
                venueName: 'DB Mall',
                venueArea: 'Arera Hills',
                venueCity: 'Bhopal',
                proposedStart: todayAt830PM,
                proposedEnd: new Date(todayAt830PM.getTime() + 60 * 60000),
                durationMinutes: 60,
                estimatedEarning: 500.0,
                expiresAt: new Date(now.getTime() + 60 * 60000),
            }
        ]
    });
    await prisma.session.createMany({
        data: [
            {
                companionId: companion.id,
                customerId: 'cust_mock_3',
                status: 'upcoming',
                category: 'cafe_conversation',
                customerInitials: 'AS',
                customerTrustScore: 95,
                customerVerified: true,
                customerSafetyConsent: true,
                venueName: 'Café Coffee Day - MP Nagar',
                venueArea: 'MP Nagar',
                venueCity: 'Bhopal',
                scheduledStart: todayAt740PM,
                scheduledEnd: new Date(todayAt740PM.getTime() + 120 * 60000),
                durationMinutes: 120,
                baseEarning: 749.0,
                estimatedTotal: 749.0,
            },
            {
                companionId: companion.id,
                customerId: 'cust_mock_4',
                status: 'upcoming',
                category: 'city_walk',
                customerInitials: 'RK',
                customerTrustScore: 92,
                customerVerified: true,
                customerSafetyConsent: true,
                venueName: 'Upper Lake',
                venueArea: 'Shamla Hills',
                venueCity: 'Bhopal',
                scheduledStart: todayAt830PM,
                scheduledEnd: new Date(todayAt830PM.getTime() + 90 * 60000),
                durationMinutes: 90,
                baseEarning: 800.0,
                estimatedTotal: 800.0,
            }
        ]
    });
    await prisma.earningsTransaction.createMany({
        data: [
            {
                companionId: companion.id,
                amount: 2550.0,
                type: 'session_earning',
                status: 'payout_eligible',
                description: 'Earnings from recent sessions',
            },
            {
                companionId: companion.id,
                amount: 1250.0,
                type: 'session_earning',
                status: 'pending_review',
                description: 'Earnings pending review',
            },
            {
                companionId: companion.id,
                amount: 1950.0,
                type: 'session_earning',
                status: 'payout_eligible',
                description: 'Extra for today',
            }
        ]
    });
    await prisma.notification.createMany({
        data: [
            {
                companionId: companion.id,
                type: 'request',
                title: 'New Booking Request from P.M.',
                body: 'Café Conversation • Today, 6:30 PM • MP Nagar • ₹749. Tap to review and accept...',
                isRead: false,
                createdAt: new Date(now.getTime() - 10 * 60 * 1000),
            },
            {
                companionId: companion.id,
                type: 'payout',
                title: 'Payout of ₹3,500 Successful',
                body: 'Your withdrawal has been processed and transferred to your registered bank account.',
                isRead: false,
                createdAt: new Date(now.getTime() - 60 * 60 * 1000),
            },
            {
                companionId: companion.id,
                type: 'system',
                title: 'Welcome to CoBuddy Companion!',
                body: 'Your profile is live. Complete your first session to unlock the Rising Star badge.',
                isRead: true,
                readAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            }
        ]
    });
    await prisma.helpArticle.deleteMany({});
    await prisma.helpArticle.createMany({
        data: [
            {
                id: 'general',
                title: 'Help Center',
                category: 'General',
                updatedDate: '15 Jun 2026',
                body: [
                    'CoBuddy is a companion services platform that connects verified companions with customers for safe, public social experiences.',
                    'All sessions must take place in approved public venues. Our guidelines exist to ensure the safety and dignity of all companions on the platform.',
                    'If you have a question not covered here, please create a support ticket or start a live chat with our support team.'
                ]
            },
            {
                id: 'disp-001',
                title: 'How to dispute a review',
                category: 'Reviews',
                updatedDate: '16 Jun 2026',
                body: [
                    'If you believe a customer left a factually incorrect or malicious review, you can file a dispute through the Reviews Dashboard.',
                    'Navigate to the review, tap the three dots, and select "Report Review". Our trust and safety team will evaluate the review against our community guidelines.'
                ]
            },
            {
                id: 'pay-001',
                title: 'How does payment work?',
                category: 'Payments',
                updatedDate: '15 Jun 2026',
                body: [
                    'CoBuddy processes payments automatically after each session is marked complete. Funds are transferred to your registered bank account within 3–5 business days.'
                ]
            }
        ]
    });
    await prisma.supportTicket.deleteMany({});
    const tkt1 = await prisma.supportTicket.create({
        data: {
            id: 'TKT-001',
            companionId: companion.id,
            subject: 'Payment not credited after session',
            description: 'I finished a session yesterday but the payment hasn\'t reflected.',
            category: 'Payment Issue',
            priority: 'Normal',
            status: 'OPEN',
            messages: {
                create: [
                    { sender: 'agent', text: 'Thank you for contacting CoBuddy Support. We are looking into this.' },
                    { sender: 'me', text: 'Please resolve this soon, it is affecting my earnings.' },
                    { sender: 'agent', text: 'We have escalated this to our payments team. You\'ll hear from us shortly.' }
                ]
            }
        }
    });
    const disp1 = await prisma.supportTicket.create({
        data: {
            id: 'DIS-001',
            companionId: companion.id,
            sessionId: '28 Jun 2026',
            customerName: 'Arjun Mehta',
            amount: '₹1,500',
            subject: 'Payment not received',
            description: 'Customer did not show up.',
            category: 'DISPUTE',
            priority: 'HIGH',
            status: 'UNDER REVIEW',
            timeline: {
                create: [
                    { date: '28 Jun, 10:00 AM', desc: 'Dispute filed by companion' },
                    { date: '28 Jun, 02:00 PM', desc: 'Case assigned to review team' },
                    { date: '29 Jun, 09:00 AM', desc: 'Under active review — evidence collected' }
                ]
            }
        }
    });
    const disp2 = await prisma.supportTicket.create({
        data: {
            id: 'DIS-002',
            companionId: companion.id,
            sessionId: '10 Jun 2026',
            customerName: 'Pooja Sharma',
            amount: '₹750',
            outcome: 'Ruled in your favor',
            subject: 'Unfair cancellation',
            description: 'Customer cancelled last minute.',
            category: 'DISPUTE',
            priority: 'HIGH',
            status: 'RESOLVED',
            timeline: {
                create: [
                    { date: '10 Jun, 06:00 PM', desc: 'Dispute filed' },
                    { date: '12 Jun, 04:00 PM', desc: 'Resolved in favor of companion' }
                ]
            }
        }
    });
    await prisma.companionServiceArea.deleteMany({ where: { companionId: companion.id } });
    await prisma.companionServiceArea.createMany({
        data: [
            { companionId: companion.id, area: 'MP Nagar', city: 'Bhopal' },
            { companionId: companion.id, area: 'Arera Colony', city: 'Bhopal' },
            { companionId: companion.id, area: 'Indrapuri', city: 'Bhopal' },
        ],
    });
    await prisma.companionBadge.deleteMany({ where: { companionId: companion.id } });
    await prisma.companionBadge.createMany({
        data: [
            { companionId: companion.id, badgeKey: 'verified_profile', badgeName: 'Verified Companion' },
            { companionId: companion.id, badgeKey: 'rising_star', badgeName: 'Rising Star' },
            { companionId: companion.id, badgeKey: 'top_rated', badgeName: 'Top Rated' },
        ],
    });
    await prisma.companionBiometric.deleteMany({ where: { companionId: companion.id } });
    await prisma.companionBiometric.create({
        data: {
            companionId: companion.id,
            deviceId: 'device-uuid-999',
            publicKey: 'mock-public-key-xyz-123',
        },
    });
    await prisma.payoutRecord.create({
        data: {
            companionId: companion.id,
            amount: 3500.0,
            status: 'completed',
            maskedBank: '•••• 2365',
            utrNumber: 'UTR998877665544',
            requestedAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
            completedAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000 + 3600 * 1000),
        },
    });
    await prisma.weeklySchedule.deleteMany({ where: { companionId: companion.id } });
    await prisma.weeklySchedule.createMany({
        data: [
            { companionId: companion.id, day: 'Mon', active: true, times: '09:00 AM - 06:00 PM' },
            { companionId: companion.id, day: 'Tue', active: true, times: '09:00 AM - 06:00 PM' },
            { companionId: companion.id, day: 'Wed', active: true, times: '09:00 AM - 06:00 PM' },
            { companionId: companion.id, day: 'Thu', active: true, times: '09:00 AM - 06:00 PM' },
            { companionId: companion.id, day: 'Fri', active: true, times: '10:00 AM - 08:00 PM' },
            { companionId: companion.id, day: 'Sat', active: true, times: '10:00 AM - 10:00 PM' },
            { companionId: companion.id, day: 'Sun', active: false, times: '10:00 AM - 06:00 PM' },
        ],
    });
    await prisma.dateOverride.create({
        data: {
            companionId: companion.id,
            startDate: '2026-08-15',
            endDate: '2026-08-15',
            reason: 'Independence Day Holiday',
            note: 'Independence Day Holiday',
            fullDay: true,
        },
    });
    await prisma.vacationMode.upsert({
        where: { companionId: companion.id },
        update: { enabled: false },
        create: { companionId: companion.id, enabled: false, awayFrom: null, returnOn: null },
    });
    await prisma.pushToken.create({
        data: {
            companionId: companion.id,
            deviceId: 'device-uuid-999',
            token: 'fcm_token_sample_123456789',
            platform: 'android',
        },
    });
    await prisma.sOSEvent.create({
        data: {
            companionId: companion.id,
            sessionId: 'sess_sample_sos',
            latitude: 23.2599,
            longitude: 77.4126,
            resolvedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
        },
    });
    await prisma.safetyTimer.upsert({
        where: { companionId: companion.id },
        update: { status: 'active' },
        create: {
            companionId: companion.id,
            status: 'active',
            durationMinutes: 90,
            startedAt: new Date(now.getTime() - 4 * 3600 * 1000),
            expiresAt: new Date(now.getTime() - 2.5 * 3600 * 1000),
        },
    });
    await prisma.trustedContact.createMany({
        data: [
            { companionId: companion.id, name: 'Mom', phone: '+919876500001', maskedPhone: '+91 98765••••1', relationship: 'Parent', isEmergencyContact: true },
            { companionId: companion.id, name: 'Rahul (Brother)', phone: '+919876500002', maskedPhone: '+91 98765••••2', relationship: 'Sibling', isEmergencyContact: false },
        ],
    });
    await prisma.blockedCustomer.create({
        data: {
            companionId: companion.id,
            customerId: 'cust_blocked_01',
            reason: 'Inappropriate language',
        },
    });
    await prisma.incidentReport.create({
        data: {
            companionId: companion.id,
            sessionId: 'sess_incident_01',
            description: 'Customer asked for private contact outside platform',
            status: 'resolved',
        },
    });
    await prisma.trustTask.createMany({
        data: [
            { companionId: companion.id, taskId: 'verify_id', title: 'Verify Government ID', description: 'Upload Aadhaar or Passport', category: 'verification', points: 30, isCompleted: true },
            { companionId: companion.id, taskId: 'complete_quiz', title: 'Complete Safety Quiz', description: 'Pass 5 safety questions', category: 'safety', points: 20, isCompleted: true },
            { companionId: companion.id, taskId: 'first_session', title: 'Complete First Session', description: 'Finish 1 session with positive rating', category: 'activity', points: 35, isCompleted: true },
        ],
    });
    await prisma.moduleCompletion.createMany({
        data: [
            { companionId: companion.id, moduleName: 'onboarding', screenName: 'BasicDetailsScreen', stepName: 'basic_details', completionStatus: 'completed', completionPercentage: 20 },
            { companionId: companion.id, moduleName: 'onboarding', screenName: 'GovernmentIdUploadScreen', stepName: 'government_id', completionStatus: 'completed', completionPercentage: 40 },
            { companionId: companion.id, moduleName: 'onboarding', screenName: 'PANTaxDetailsScreen', stepName: 'pan', completionStatus: 'completed', completionPercentage: 60 },
            { companionId: companion.id, moduleName: 'onboarding', screenName: 'AddBankAccountScreen', stepName: 'bank', completionStatus: 'completed', completionPercentage: 80 },
            { companionId: companion.id, moduleName: 'onboarding', screenName: 'SubmitProfileForApprovalScreen', stepName: 'submit', completionStatus: 'completed', completionPercentage: 100 },
            { companionId: companion.id, moduleId: module1.id, moduleName: 'training', screenName: 'TrainingModuleDetailScreen', stepName: 'mod_1_intro', completionStatus: 'completed', score: 100, completionPercentage: 100 },
        ],
    });
    await prisma.uploadedFile.create({
        data: {
            companionId: companion.id,
            url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a',
            key: 'uploads/companion/profile_photo_sample.jpg',
            category: 'profile_photo',
            originalName: 'photo.jpg',
            mimeType: 'image/jpeg',
            size: 154200,
        },
    });
    await prisma.oTPSession.create({
        data: {
            phone: '9999992398',
            otp: '123456',
            expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
            verified: true,
        },
    });
    await prisma.refreshToken.create({
        data: {
            companionId: companion.id,
            token: 'sample_refresh_token_jwt_999',
            deviceId: 'device-uuid-999',
            expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
        },
    });
    await prisma.razorpayOrder.create({
        data: {
            razorpayOrderId: 'order_sample_rzp_123',
            companionId: companion.id,
            amountPaisa: 74900,
            status: 'paid',
        },
    });
    console.log('Seeding Finished!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map