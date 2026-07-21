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
        where: { phone: '9999999999' },
        update: {},
        create: {
            phone: '9999999999',
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
    await prisma.companionSettings.upsert({
        where: { companionId: companion.id },
        update: {},
        create: {
            companionId: companion.id,
            notificationPrefs: {
                new_booking_push: true,
                session_reminders: true,
                promotional_offers: false,
            },
            privacyVisibility: 'public',
        },
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
            description: 'Learn the basics of being a great Companion.',
            category: 'Onboarding',
            content: 'https://example.com/training/intro',
            durationMinutes: 15,
            isRequired: true,
        },
    });
    const module2 = await prisma.trainingModule.upsert({
        where: { id: 'mod_2_safety' },
        update: {},
        create: {
            id: 'mod_2_safety',
            title: 'Safety Guidelines',
            description: 'Crucial safety rules and emergency protocols.',
            category: 'Safety',
            content: 'https://example.com/training/safety',
            durationMinutes: 20,
            isRequired: true,
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