import { PrismaClient, Category, ProfileStatus, VerificationStatus, AccountStatus, TrustLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Seeding Database...');

  // 1. Create a Test Companion Profile
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
      profileStatus: ProfileStatus.approved,
      verificationStatus: VerificationStatus.approved,
      accountStatus: AccountStatus.active,
      trustScore: 85,
      trustLevel: TrustLevel.building,
      rating: 4.8,
      totalReviews: 12,
      totalSessions: 15,
      isAvailable: true,
      isOnline: false,
    },
  });

  console.log('Created Companion:', companion.id);

  // 2. Add Companion Settings
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

  // 3. Add KYC and PIN
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
      pinHash: '$2b$10$XmO9jR/C.fL3J6I6sF1I..X7Z/xH00F5kYy9l8oQ4L7.P8w8.lT2O', // Represents '1234'
    },
  });

  // 4. Add Categories and Languages
  await prisma.companionCategory.createMany({
    data: [
      { companionId: companion.id, category: Category.cafe_conversation },
      { companionId: companion.id, category: Category.city_walk },
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

  // 5. Training Modules
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
