import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { Category } from '@prisma/client';

const VENUES = [
  { name: 'Café Coffee Day - MP Nagar', area: 'MP Nagar', city: 'Bhopal' },
  { name: 'DB Mall Food Court', area: 'Arera Hills', city: 'Bhopal' },
  { name: 'Lakeview Cafe', area: 'VIP Road', city: 'Bhopal' },
  { name: 'Bhoj Wetland', area: 'Shymala Hills', city: 'Bhopal' },
  { name: 'Board Game Cafe', area: 'New Market', city: 'Bhopal' },
  { name: 'Spice Garden', area: 'Kolar Road', city: 'Bhopal' },
  { name: 'Central Park', area: 'Zone-1', city: 'Bhopal' },
];

const CATEGORIES: Category[] = [
  'cafe_conversation',
  'city_walk',
  'event_companion',
  'shopping_buddy',
  'cultural_guide',
] as Category[];

const CUSTOMERS = [
  { initials: 'PM', trustScore: 94 },
  { initials: 'RK', trustScore: 88 },
  { initials: 'AS', trustScore: 91 },
  { initials: 'MV', trustScore: 85 },
  { initials: 'JD', trustScore: 96 },
  { initials: 'SK', trustScore: 82 },
  { initials: 'NP', trustScore: 90 },
];

const NOTES = [
  'Looking forward to exploring the city!',
  'First time in Bhopal, need a local guide.',
  'Want to try local food and culture.',
  'Looking for a friendly companion for an evening.',
  undefined,
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

@Injectable()
export class RequestSimulatorService {
  private readonly logger = new Logger(RequestSimulatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Every 2 minutes: create a new pending request for each companion ────────
  @Cron('*/2 * * * *')
  async createSimulatedRequest() {
    try {
      // Get all active companions
      const companions = await this.prisma.companion.findMany({
        where: { accountStatus: 'active' },
        select: { id: true },
      });

      if (companions.length === 0) return;

      const now = new Date();
      const venue = rand(VENUES);
      const category = rand(CATEGORIES);
      const customer = rand(CUSTOMERS);
      const note = rand(NOTES);

      // Proposed start: 30min to 3hrs from now
      const startOffsetMs = randInt(30, 180) * 60000;
      const durationMin = rand([60, 90, 120, 150]);
      const proposedStart = new Date(now.getTime() + startOffsetMs);
      const proposedEnd = new Date(proposedStart.getTime() + durationMin * 60000);
      const estimatedEarning = Math.round((durationMin / 60) * rand([400, 500, 600, 700, 800]));

      for (const companion of companions) {
        await this.prisma.bookingRequest.create({
          data: {
            companionId: companion.id,
            customerId: `sim_cust_${Date.now()}`,
            status: 'pending',
            category,
            customerInitials: customer.initials,
            customerTrustScore: customer.trustScore,
            customerVerified: true,
            customerSafetyConsent: true,
            customerIdentityVerified: true,
            venueName: venue.name,
            venueArea: venue.area,
            venueCity: venue.city,
            proposedStart,
            proposedEnd,
            durationMinutes: durationMin,
            estimatedEarning,
            matchScore: customer.trustScore,
            customerNote: note,
            expiresAt: new Date(now.getTime() + 15 * 60000), // expires in 15 min
          },
        });
        this.logger.log(`✅ Simulated request created for companion ${companion.id} [${category} @ ${venue.name}]`);
      }
    } catch (err: any) {
      this.logger.error('Failed to create simulated request', err?.message);
    }
  }

  // ── Every minute: expire requests older than 15 minutes ─────────────────────
  @Cron(CronExpression.EVERY_MINUTE)
  async expireOldRequests() {
    try {
      const cutoff = new Date(Date.now() - 15 * 60000);
      const result = await this.prisma.bookingRequest.updateMany({
        where: {
          status: 'pending',
          expiresAt: { lte: new Date() },
        },
        data: { status: 'expired' },
      });
      if (result.count > 0) {
        this.logger.log(`🕐 Expired ${result.count} old pending requests`);
      }
    } catch (err: any) {
      this.logger.error('Failed to expire requests', err?.message);
    }
  }
}
