const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://cobuddy:cobuddy@localhost:5432/cobuddy_companion?schema=public'
});

async function main() {
  const comp = await pool.query('SELECT id, phone FROM companions LIMIT 1;');
  console.log('Found companion:', comp.rows[0]);
  if (!comp.rows[0]) return;

  const compId = comp.rows[0].id;
  await pool.query(`
    UPDATE companions SET
      "displayName" = 'Ananya Verma',
      "city" = 'Bengaluru',
      "bio" = 'Art lover, avid reader and coffee enthusiast.',
      "hourlyRate" = 500,
      "rating" = 4.9,
      "trustScore" = 95,
      "totalReviews" = 12,
      "totalSessions" = 18,
      "profileStatus" = 'approved',
      "verificationStatus" = 'approved',
      "accountStatus" = 'active',
      "photoUrl" = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
    WHERE id = $1;
  `, [compId]);

  await pool.query(`
    INSERT INTO companion_categories ("id", "companionId", "category")
    VALUES (gen_random_uuid()::text, $1, 'cafe_conversation'::"Category")
    ON CONFLICT DO NOTHING;
  `, [compId]);

  console.log(`Companion ${compId} updated to APPROVED in cobuddy_companion DB`);
  await pool.end();
}

main().catch(console.error);
