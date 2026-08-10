import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ProgressEngineService } from '../src/modules/kyc/progress-engine.service';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const companionId = 'cmsd3ug6j003m01lo161zxzyk';

  await prisma.companion.update({
    where: { id: companionId },
    data: {
      venuePreferences: ['cafes', 'restaurants', 'shopping_malls', 'parks'],
      photoUrl: 'http://localhost:4001/uploads/companions/cmsd3ug6j003m01lo161zxzyk/profile_photo/sample.jpg',
    },
  });

  const progressEngine = new ProgressEngineService(prisma as any);
  const status = await progressEngine.getOnboardingStatus(companionId);

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('UPDATED ONBOARDING STATUS FOR ACTIVE COMPANION:');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Profile Completion: ${status.profileCompletion}%`);
  console.log(`Completed Modules Count: ${status.completedModules.length}`);
  console.log(`Pending Modules:`, status.pendingModules);
  console.log(`Resume Route: ${status.resumeRoute}`);
}

main().catch(console.error);
