import { PrismaClient, ProfileStatus, VerificationStatus, AccountStatus, TrustLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('\n=== Fixing companion profiles → APPROVED/ACTIVE ===\n');

  const companions = await prisma.companion.findMany({
    select: { id: true, displayName: true, phone: true, profileStatus: true, verificationStatus: true, accountStatus: true },
  });

  console.log(`Found ${companions.length} companions\n`);

  for (const c of companions) {
    console.log(`Companion: "${c.displayName || 'unnamed'}" | phone=${c.phone}`);
    console.log(`  Before: profileStatus=${c.profileStatus} | verificationStatus=${c.verificationStatus} | accountStatus=${c.accountStatus}`);

    await prisma.companion.update({
      where: { id: c.id },
      data: {
        profileStatus: ProfileStatus.approved,
        verificationStatus: VerificationStatus.approved,
        accountStatus: AccountStatus.active,
        isAvailable: true,
        trustScore: 85,
        trustLevel: TrustLevel.trusted,
      },
    });
    console.log(`  After:  profileStatus=approved | verificationStatus=approved | accountStatus=active ✅`);

    // Also set KYC submission date so syncProgressWithBackend sees it as complete
    const kyc = await prisma.companionKYC.findUnique({ where: { companionId: c.id } });
    if (kyc) {
      await prisma.companionKYC.update({
        where: { companionId: c.id },
        data: {
          submittedAt: kyc.submittedAt ?? new Date(),
          approvedAt: new Date(),
          declarationAgreedAt: kyc.declarationAgreedAt ?? new Date(),
        },
      });
      console.log(`  KYC: Updated approvedAt ✅`);
    } else {
      console.log(`  KYC: No KYC record (OK — companion.verificationStatus=approved is enough)`);
    }

    console.log('');
  }

  console.log('🎉 All profiles fixed!\n');
  console.log('Next steps:');
  console.log('1. On your phone: Shake → Reload (or press R in Metro terminal)');
  console.log('2. The app should now go directly to the HOME DASHBOARD');
  console.log('3. You should see: 2 booking requests + 2 upcoming sessions + earnings\n');
}

main()
  .catch(e => { console.error('ERROR:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
