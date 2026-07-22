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
    where: { phone: '9999992398' },
    update: {},
    create: {
      phone: '9999992398',
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

  // 2.  // Companion Settings
  await prisma.companionSettings.deleteMany({ where: { companionId: companion.id } });
  await prisma.companionSettings.create({
    data: {
      companionId: companion.id,
      language: 'en',
      notificationPrefs: {
        new_booking_push: true,
        session_reminder_push: true,
        payout_email: true,
        marketing_email: false,
      },
      showAge: true,
      allowPromo: false,
      showInSearch: true,
    }
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

  // 6. Add Dashboard Mock Data (Requests, Sessions, Earnings, TimeSlots)
  const now = new Date();
  const todayAt740PM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 40, 0);
  const todayAt830PM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30, 0);

  // Update Companion Profile with Screenshot details
  await prisma.companion.update({
    where: { id: companion.id },
    data: {
      displayName: 'Arjun S.',
      tagline: 'Explorer & Food Enthusiast',
      city: 'Bhopal',
      bio: "Hi! I love showing people around the city's hidden gems, trying new cafés, and having real conversations about life, tech, and culture. Let's explore together!",
      rating: 4.8,
      totalSessions: 47,
      totalReviews: 24,
      verificationStatus: 'approved',
      interestTags: ['coffee', 'dining', 'music'],
      isAvailable: false, // 0 Available slots
    }
  });

  // Mock Gallery Photos
  await prisma.companionPhoto.deleteMany({ where: { companionId: companion.id } });
  await prisma.companionPhoto.createMany({
    data: [
      { companionId: companion.id, url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a', sortOrder: 0 },
      { companionId: companion.id, url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352', sortOrder: 1 },
      { companionId: companion.id, url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', sortOrder: 2 },
    ]
  });

  // Mock Reviews
  await prisma.companionReview.deleteMany({ where: { companionId: companion.id } });
  await prisma.companionReview.createMany({
    data: [
      {
        companionId: companion.id,
        sessionId: `mock_sess_review_1_${Date.now()}`,
        customerInitials: 'Neha S.',
        rating: 5.0,
        comment: 'An amazing CoBuddy experience! We had a great time exploring the cafés. Super knowledgeable an...',
        sessionCategory: 'cafe_conversation',
        sessionDate: new Date('2026-06-25T10:00:00Z'),
      },
      {
        companionId: companion.id,
        sessionId: `mock_sess_review_2_${Date.now()}`,
        customerInitials: 'Aman K.',
        rating: 5.0,
        comment: 'Very polite and knowledgeable about the city. Made me feel safe and comfortable throughout.',
        sessionCategory: 'city_walk',
        sessionDate: new Date('2026-06-20T10:00:00Z'),
      }
    ]
  });

  // Pending Booking Requests (2 New requests)
  await prisma.bookingRequest.createMany({
    data: [
      {
        companionId: companion.id,
        customerId: 'cust_mock_1',
        status: 'pending',
        category: 'cafe_conversation',
        customerInitials: 'JD',
        customerTrustScore: 90,
        customerVerified: true,
        customerSafetyConsent: true,
        venueName: 'Café Coffee Day',
        venueArea: 'MP Nagar',
        venueCity: 'Bhopal',
        proposedStart: todayAt740PM,
        proposedEnd: new Date(todayAt740PM.getTime() + 120 * 60000),
        durationMinutes: 120,
        estimatedEarning: 749.0,
        expiresAt: new Date(now.getTime() + 60 * 60000),
      },
      {
        companionId: companion.id,
        customerId: 'cust_mock_2',
        status: 'pending',
        category: 'city_walk',
        customerInitials: 'MK',
        customerTrustScore: 85,
        customerVerified: true,
        customerSafetyConsent: true,
        venueName: 'DB Mall',
        venueArea: 'Arera Hills',
        venueCity: 'Bhopal',
        proposedStart: todayAt830PM,
        proposedEnd: new Date(todayAt830PM.getTime() + 60 * 60000),
        durationMinutes: 60,
        estimatedEarning: 500.0,
        expiresAt: new Date(now.getTime() + 60 * 60000),
      }
    ]
  });

  // Upcoming Sessions (2 Upcoming sessions)
  await prisma.session.createMany({
    data: [
      {
        companionId: companion.id,
        customerId: 'cust_mock_3',
        status: 'upcoming',
        category: 'cafe_conversation',
        customerInitials: 'AS',
        customerTrustScore: 95,
        customerVerified: true,
        customerSafetyConsent: true,
        venueName: 'Café Coffee Day - MP Nagar',
        venueArea: 'MP Nagar',
        venueCity: 'Bhopal',
        scheduledStart: todayAt740PM,
        scheduledEnd: new Date(todayAt740PM.getTime() + 120 * 60000),
        durationMinutes: 120,
        baseEarning: 749.0,
        estimatedTotal: 749.0,
      },
      {
        companionId: companion.id,
        customerId: 'cust_mock_4',
        status: 'upcoming',
        category: 'city_walk',
        customerInitials: 'RK',
        customerTrustScore: 92,
        customerVerified: true,
        customerSafetyConsent: true,
        venueName: 'Upper Lake',
        venueArea: 'Shamla Hills',
        venueCity: 'Bhopal',
        scheduledStart: todayAt830PM,
        scheduledEnd: new Date(todayAt830PM.getTime() + 90 * 60000),
        durationMinutes: 90,
        baseEarning: 800.0,
        estimatedTotal: 800.0,
      }
    ]
  });

  // Earnings Transactions (To match This Week: 2550, Pending: 1250, Today: 4500)
  // We'll create a few transactions.
  await prisma.earningsTransaction.createMany({
    data: [
      {
        companionId: companion.id,
        amount: 2550.0, // This Week approved
        type: 'session_earning',
        status: 'payout_eligible',
        description: 'Earnings from recent sessions',
      },
      {
        companionId: companion.id,
        amount: 1250.0, // Pending
        type: 'session_earning',
        status: 'pending_review',
        description: 'Earnings pending review',
      },
      {
        companionId: companion.id,
        amount: 1950.0, // Extra to make up Today = 4500 (2550 + 1950 = 4500 for this month/today calculation depending on how frontend calculates)
        type: 'session_earning',
        status: 'payout_eligible',
        description: 'Extra for today',
      }
    ]
  });

  // We set 0 TimeSlots so Available slots = 0
  // No timeslot created.

  // Notifications Mock Data
  await prisma.notification.createMany({
    data: [
      {
        companionId: companion.id,
        type: 'request',
        title: 'New Booking Request from P.M.',
        body: 'Café Conversation • Today, 6:30 PM • MP Nagar • ₹749. Tap to review and accept...',
        isRead: false,
        createdAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 mins ago
      },
      {
        companionId: companion.id,
        type: 'payout',
        title: 'Payout of ₹3,500 Successful',
        body: 'Your withdrawal has been processed and transferred to your registered bank account.',
        isRead: false,
        createdAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hr ago
      },
      {
        companionId: companion.id,
        type: 'system',
        title: 'Welcome to CoBuddy Companion!',
        body: 'Your profile is live. Complete your first session to unlock the Rising Star badge.',
        isRead: true,
        readAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      }
    ]
  });

  // Mock Help Articles
  await prisma.helpArticle.deleteMany({});
  await prisma.helpArticle.createMany({
    data: [
      {
        id: 'general',
        title: 'Help Center',
        category: 'General',
        updatedDate: '15 Jun 2026',
        body: [
          'CoBuddy is a companion services platform that connects verified companions with customers for safe, public social experiences.',
          'All sessions must take place in approved public venues. Our guidelines exist to ensure the safety and dignity of all companions on the platform.',
          'If you have a question not covered here, please create a support ticket or start a live chat with our support team.'
        ]
      },
      {
        id: 'disp-001',
        title: 'How to dispute a review',
        category: 'Reviews',
        updatedDate: '16 Jun 2026',
        body: [
          'If you believe a customer left a factually incorrect or malicious review, you can file a dispute through the Reviews Dashboard.',
          'Navigate to the review, tap the three dots, and select "Report Review". Our trust and safety team will evaluate the review against our community guidelines.'
        ]
      },
      {
        id: 'pay-001',
        title: 'How does payment work?',
        category: 'Payments',
        updatedDate: '15 Jun 2026',
        body: [
          'CoBuddy processes payments automatically after each session is marked complete. Funds are transferred to your registered bank account within 3–5 business days.'
        ]
      }
    ]
  });

  // Mock Support Tickets and Disputes
  await prisma.supportTicket.deleteMany({});
  const tkt1 = await prisma.supportTicket.create({
    data: {
      id: 'TKT-001',
      companionId: companion.id,
      subject: 'Payment not credited after session',
      description: 'I finished a session yesterday but the payment hasn\'t reflected.',
      category: 'Payment Issue',
      priority: 'Normal',
      status: 'OPEN',
      messages: {
        create: [
          { sender: 'agent', text: 'Thank you for contacting CoBuddy Support. We are looking into this.' },
          { sender: 'me', text: 'Please resolve this soon, it is affecting my earnings.' },
          { sender: 'agent', text: 'We have escalated this to our payments team. You\'ll hear from us shortly.' }
        ]
      }
    }
  });

  const disp1 = await prisma.supportTicket.create({
    data: {
      id: 'DIS-001',
      companionId: companion.id,
      sessionId: '28 Jun 2026',
      customerName: 'Arjun Mehta',
      amount: '₹1,500',
      subject: 'Payment not received',
      description: 'Customer did not show up.',
      category: 'DISPUTE',
      priority: 'HIGH',
      status: 'UNDER REVIEW',
      timeline: {
        create: [
          { date: '28 Jun, 10:00 AM', desc: 'Dispute filed by companion' },
          { date: '28 Jun, 02:00 PM', desc: 'Case assigned to review team' },
          { date: '29 Jun, 09:00 AM', desc: 'Under active review — evidence collected' }
        ]
      }
    }
  });

  const disp2 = await prisma.supportTicket.create({
    data: {
      id: 'DIS-002',
      companionId: companion.id,
      sessionId: '10 Jun 2026',
      customerName: 'Pooja Sharma',
      amount: '₹750',
      outcome: 'Ruled in your favor',
      subject: 'Unfair cancellation',
      description: 'Customer cancelled last minute.',
      category: 'DISPUTE',
      priority: 'HIGH',
      status: 'RESOLVED',
      timeline: {
        create: [
          { date: '10 Jun, 06:00 PM', desc: 'Dispute filed' },
          { date: '12 Jun, 04:00 PM', desc: 'Resolved in favor of companion' }
        ]
      }
    }
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
