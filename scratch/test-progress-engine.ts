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
  const progressEngine = new ProgressEngineService(prisma as any);

  const companionId = 'cmsd3ug6j003m01lo161zxzyk';
  const status = await progressEngine.getOnboardingStatus(companionId);

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('ONBOARDING STATUS COMPUTED BY PROGRESS ENGINE:');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(JSON.stringify(status, null, 2));
}

main().catch(console.error);
