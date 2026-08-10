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

  const result = await prisma.companion.updateMany({
    where: {
      interestTags: { isEmpty: true },
    },
    data: {
      interestTags: ['coffee', 'art_lover', 'city_explorer', 'great_listener'],
    },
  });
  console.log('Updated companions with default interestTags:', result.count);
}

main().catch(console.error);
