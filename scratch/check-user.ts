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

  const companions = await prisma.companion.findMany({
    take: 5,
    select: {
      id: true,
      phone: true,
      displayName: true,
      interestTags: true,
      commActivityPrefs: true,
      categories: true,
    },
  });
  console.log('Companions in DB:', JSON.stringify(companions, null, 2));
}

main().catch(console.error);
