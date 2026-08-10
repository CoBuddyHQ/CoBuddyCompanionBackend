import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('COBUDDY COMPANION — COMPLETE FULL-STACK DATABASE AUDIT');
  console.log('═══════════════════════════════════════════════════════════════════');

  const companionsCount = await prisma.companion.count();
  const kycCount = await prisma.companionKYC.count();
  const photosCount = await prisma.companionPhoto.count();
  const filesCount = await prisma.uploadedFile.count();
  const serviceAreasCount = await prisma.companionServiceArea.count();
  const categoriesCount = await prisma.companionCategory.count();
  const languagesCount = await prisma.companionLanguage.count();
  const requestsCount = await prisma.bookingRequest.count();
  const sessionsCount = await prisma.session.count();

  console.log(`📊 Companions Count: ${companionsCount}`);
  console.log(`📊 Companion KYC Records: ${kycCount}`);
  console.log(`📊 Companion Gallery Photos: ${photosCount}`);
  console.log(`📊 Uploaded Files Metadata: ${filesCount}`);
  console.log(`📊 Service Areas: ${serviceAreasCount}`);
  console.log(`📊 Profile Categories: ${categoriesCount}`);
  console.log(`📊 Languages: ${languagesCount}`);
  console.log(`📊 Booking Requests: ${requestsCount}`);
  console.log(`📊 Active/Past Sessions: ${sessionsCount}`);

  const activeCompanion = await prisma.companion.findFirst({
    where: { phone: { contains: '8524542545' } },
    include: {
      kyc: true,
      serviceAreas: true,
      categories: true,
      languages: true,
      galleryPhotos: true,
      settings: true,
    },
  });

  console.log('\n🔍 Active Test Companion Profile in DB:');
  if (activeCompanion) {
    console.log(JSON.stringify({
      id: activeCompanion.id,
      phone: activeCompanion.phone,
      displayName: activeCompanion.displayName,
      profileStatus: activeCompanion.profileStatus,
      verificationStatus: activeCompanion.verificationStatus,
      interestTags: activeCompanion.interestTags,
      hourlyRate: activeCompanion.hourlyRate,
      categories: activeCompanion.categories.map(c => c.category),
      languages: activeCompanion.languages.map(l => l.language),
      kycSubmittedAt: activeCompanion.kyc?.submittedAt,
    }, null, 2));
  } else {
    console.log('No specific companion matching phone found. Displaying first companion in DB:');
    const firstCompanion = await prisma.companion.findFirst({
      include: { kyc: true, categories: true, languages: true },
    });
    console.log(JSON.stringify(firstCompanion, null, 2));
  }
}

main().catch(console.error);
