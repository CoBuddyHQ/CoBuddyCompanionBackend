const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://cobuddy:development-secret-password-2026@localhost:5432/cobuddy_companion?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const reqs = await prisma.bookingRequest.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log('--- COMPANION DB BOOKING REQUESTS ---');
  console.log(reqs);

  const sessions = await prisma.session.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log('--- COMPANION DB SESSIONS ---');
  console.log(sessions);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
