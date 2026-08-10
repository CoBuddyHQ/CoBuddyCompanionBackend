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

  console.log('=== AUDITING UPLOADED FILES & KYC RECORDS IN POSTGRESQL ===');
  
  const filesCount = await prisma.uploadedFile.count();
  const kycCount = await prisma.companionKYC.count();
  const photosCount = await prisma.companionPhoto.count();

  console.log(`Uploaded Files Count: ${filesCount}`);
  console.log(`Companion KYC Records Count: ${kycCount}`);
  console.log(`Companion Gallery Photos Count: ${photosCount}`);

  const sampleKyc = await prisma.companionKYC.findFirst({
    select: {
      companionId: true,
      identityDocumentType: true,
      identityDocumentUrl: true,
      identityDocumentBackUrl: true,
      identitySubmittedAt: true,
      selfieImageUrl: true,
      selfieVideoUrl: true,
      selfieSubmittedAt: true,
      addressDocumentType: true,
      addressDocumentUrl: true,
      addressSubmittedAt: true,
      submittedAt: true,
      approvedAt: true,
    },
  });
  console.log('Sample Companion KYC Status in DB:', JSON.stringify(sampleKyc, null, 2));

  const uploadedFiles = await prisma.uploadedFile.findMany({
    take: 5,
    select: {
      id: true,
      companionId: true,
      category: true,
      url: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  });
  console.log('Recent Uploaded Files in DB:', JSON.stringify(uploadedFiles, null, 2));
}

main().catch(console.error);
