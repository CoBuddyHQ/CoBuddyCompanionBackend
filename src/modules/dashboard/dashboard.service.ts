import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Simple in-memory TTL cache (companionId → { data, expiresAt })
const dashboardCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(companionId: string) {
    // Return cached result if still fresh
    const cached = dashboardCache.get(companionId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    if (!companion) throw new NotFoundException('Companion not found');


    // Auto-seed demo data for companions with empty dashboard
    await this.ensureDemoData(companionId);

    const [activeSessions, upcomingSessions, pendingRequests, unreadNotifs] = await Promise.all([
      this.prisma.session.findMany({ where: { companionId, status: 'active' }, take: 1 }),
      this.prisma.session.findMany({
        where: { companionId, status: { in: ['upcoming', 'pre_arrival'] } },
        orderBy: { scheduledStart: 'asc' },
        take: 3,
      }),
      this.prisma.bookingRequest.findMany({
        where: { companionId, status: 'pending' },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { companionId, isRead: false } }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [monthTxs, todayTxs, pendingTxs, weekPayouts] = await Promise.all([
      this.prisma.earningsTransaction.findMany({
        where: {
          companionId,
          createdAt: { gte: monthStart },
          type: { in: ['session_earning', 'extension_earning', 'safety_bonus'] },
          status: { not: 'on_hold' },
        },
      }),
      this.prisma.earningsTransaction.findMany({
        where: {
          companionId,
          createdAt: { gte: todayStart },
          type: { in: ['session_earning', 'extension_earning', 'safety_bonus'] },
          status: { not: 'on_hold' },
        },
      }),
      this.prisma.earningsTransaction.findMany({
        where: { companionId, status: 'pending_review' },
      }),
      this.prisma.earningsTransaction.findMany({
        where: {
          companionId,
          createdAt: { gte: new Date(now.getTime() - 7 * 86400000) },
          type: { in: ['session_earning', 'extension_earning', 'safety_bonus'] },
          status: { in: ['payout_eligible', 'approved'] },
        },
      }),
    ]);

    const totalEarnedThisMonth = monthTxs.reduce((sum, t) => sum + Math.max(0, Number(t.amount)), 0);
    const todayEarnings = todayTxs.reduce((sum, t) => sum + Math.max(0, Number(t.amount)), 0);
    const pendingEarnings = pendingTxs.reduce((sum, t) => sum + Math.max(0, Number(t.amount)), 0);
    const thisWeekEarnings = weekPayouts.reduce((sum, t) => sum + Math.max(0, Number(t.amount)), 0);

    const result = {
      companion: {
        companionId: companion.id,
        displayName: companion.displayName ?? '',
        profileStatus: companion.profileStatus ? String(companion.profileStatus).toLowerCase() : 'draft',
        verificationStatus: companion.verificationStatus ? String(companion.verificationStatus).toLowerCase() : 'not_started',
        isAvailable: companion.isAvailable ?? false,
        trustScore: companion.trustScore ?? 0,
        trustLevel: companion.trustLevel ? String(companion.trustLevel).toLowerCase() : 'new',
        photoUrl: companion.photoUrl ?? null,
      },
      stats: {
        totalEarnedThisMonth,
        todayEarnings,
        pendingEarnings,
        thisWeekEarnings,
        unreadNotificationsCount: unreadNotifs,
        pendingRequestsCount: pendingRequests.length,
        upcomingSessionsCount: upcomingSessions.length,
      },
      activeSession: activeSessions[0] ? this.toSessionPreview(activeSessions[0]) : null,
      upcomingSessions: upcomingSessions.map(s => this.toSessionPreview(s)),
      recentRequests: pendingRequests.slice(0, 3).map(r => this.toRequestPreview(r)),
    };

    // Store in cache for 30 seconds
    dashboardCache.set(companionId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }

  private async ensureDemoData(companionId: string) {
    const [reqCount, sessCount, txCount, notifCount] = await Promise.all([
      this.prisma.bookingRequest.count({ where: { companionId } }),
      this.prisma.session.count({ where: { companionId } }),
      this.prisma.earningsTransaction.count({ where: { companionId } }),
      this.prisma.notification.count({ where: { companionId } }),
    ]);

    const now = new Date();

    if (reqCount === 0) {
      await this.prisma.bookingRequest.createMany({
        data: [
          {
            companionId,
            customerId: 'cust_demo_001',
            status: 'pending',
            category: 'cafe_conversation',
            customerInitials: 'PM',
            customerTrustScore: 94,
            customerVerified: true,
            customerSafetyConsent: true,
            customerIdentityVerified: true,
            venueName: 'Café Coffee Day - MP Nagar',
            venueArea: 'MP Nagar',
            venueCity: 'Bhopal',
            proposedStart: new Date(now.getTime() + 3600000 * 2),
            proposedEnd: new Date(now.getTime() + 3600000 * 4),
            durationMinutes: 120,
            estimatedEarning: 1299.0,
            expiresAt: new Date(now.getTime() + 3600000 * 23),
            customerNote: 'Looking forward to exploring the city!',
          },
          {
            companionId,
            customerId: 'cust_demo_002',
            status: 'pending',
            category: 'city_walk',
            customerInitials: 'RK',
            customerTrustScore: 88,
            customerVerified: true,
            customerSafetyConsent: true,
            customerIdentityVerified: true,
            venueName: 'DB Mall',
            venueArea: 'Arera Hills',
            venueCity: 'Bhopal',
            proposedStart: new Date(now.getTime() + 3600000 * 6),
            proposedEnd: new Date(now.getTime() + 3600000 * 7.5),
            durationMinutes: 90,
            estimatedEarning: 1099.0,
            expiresAt: new Date(now.getTime() + 3600000 * 20),
          },
        ],
      });
    }

    if (sessCount === 0) {
      await this.prisma.session.createMany({
        data: [
          {
            companionId,
            customerId: 'cust_demo_003',
            status: 'upcoming',
            category: 'cafe_conversation',
            customerInitials: 'AS',
            customerTrustScore: 95,
            customerVerified: true,
            customerSafetyConsent: true,
            venueName: 'Café Coffee Day - MP Nagar',
            venueArea: 'MP Nagar',
            venueCity: 'Bhopal',
            scheduledStart: new Date(now.getTime() + 3600000 * 4),
            scheduledEnd: new Date(now.getTime() + 3600000 * 6),
            durationMinutes: 120,
            baseEarning: 749.0,
            estimatedTotal: 749.0,
            sessionPassCode: 'AR-642',
          },
          {
            companionId,
            customerId: 'cust_demo_004',
            status: 'upcoming',
            category: 'city_walk',
            customerInitials: 'MK',
            customerTrustScore: 90,
            customerVerified: true,
            customerSafetyConsent: true,
            venueName: 'Upper Lake Walkway',
            venueArea: 'Shamla Hills',
            venueCity: 'Bhopal',
            scheduledStart: new Date(now.getTime() + 3600000 * 26),
            scheduledEnd: new Date(now.getTime() + 3600000 * 27.5),
            durationMinutes: 90,
            baseEarning: 800.0,
            estimatedTotal: 800.0,
            sessionPassCode: 'MK-219',
          },
        ],
      });
    }

    if (txCount === 0) {
      await this.prisma.earningsTransaction.createMany({
        data: [
          {
            companionId,
            amount: 2550.0,
            type: 'session_earning',
            status: 'payout_eligible',
            customerInitials: 'Neha S.',
            description: 'Café Conversation Session Earning',
          },
          {
            companionId,
            amount: 1250.0,
            type: 'session_earning',
            status: 'pending_review',
            customerInitials: 'Aman K.',
            description: 'City Walk Earning (48h clearance)',
          },
          {
            companionId,
            amount: 1950.0,
            type: 'session_earning',
            status: 'payout_eligible',
            customerInitials: 'Rahul M.',
            description: 'Food Experience Earning',
          },
        ],
      });
    }

    if (notifCount === 0) {
      await this.prisma.notification.createMany({
        data: [
          {
            companionId,
            type: 'request',
            title: 'New Booking Request from P.M.',
            body: 'Café Conversation • Today • MP Nagar • ₹749. Tap to review.',
            isRead: false,
            createdAt: new Date(now.getTime() - 600000),
          },
          {
            companionId,
            type: 'payout',
            title: 'Payout of ₹3,500 Successful',
            body: 'Your withdrawal has been processed to your registered bank account.',
            isRead: false,
            createdAt: new Date(now.getTime() - 3600000),
          },
          {
            companionId,
            type: 'system',
            title: 'Welcome to CoBuddy Companion!',
            body: 'Your profile is live. Complete your first session to unlock the Rising Star badge.',
            isRead: true,
            createdAt: new Date(now.getTime() - 86400000),
          },
        ],
      });
    }
  }


  async getPerformanceInsights(companionId: string, period: 'week' | 'month' = 'week') {
    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    const totalSessions = companion?.totalSessions ?? 0;
    const totalReviews = companion?.totalReviews ?? 0;
    const rating = companion?.rating ? Number(companion.rating) : 0.0;

    const views = period === 'month' ? 540 + totalSessions * 12 : 145 + totalSessions * 5;
    const delta = period === 'month' ? 24 : 12;
    const conversion = Math.min(100, Math.max(10, Math.round(15 + (rating ? (rating - 3) * 5 : 0))));

    return {
      period,
      views,
      delta,
      conversionRate: `${conversion}%`,
      avgResponseTime: '5 min',
      profileClickThrough: '8%',
      totalSessions,
      totalReviews,
      rating,
    };
  }

  async getAnnouncements() {
    return {
      announcements: [
        {
          id: '1',
          icon: 'bolt',
          iconColor: '#D6A84F',
          iconBg: 'rgba(214,168,79,0.15)',
          tag: 'NEW FEATURE',
          tagColor: '#D6A84F',
          title: 'New Feature: Instant Payouts!',
          body: 'You can now request an instant payout at any time, 24/7. Funds arrive in your bank account within 2 hours. Available for companions with a trust score above 80.',
          date: '15 Jun',
          url: 'https://cobuddy.app/blog/instant-payouts',
        },
        {
          id: '2',
          icon: 'security',
          iconColor: '#E74C3C',
          iconBg: 'rgba(231,76,60,0.12)',
          tag: 'SAFETY UPDATE',
          tagColor: '#E74C3C',
          title: 'Updated Safety Guidelines for Public Venues',
          body: 'We have updated our public venue safety guidelines to include new rules for crowded spaces and late-evening sessions. Please review the updated guidelines before your next session.',
          date: '10 Jun',
          url: 'https://cobuddy.app/safety/venue-guidelines',
        },
        {
          id: '3',
          icon: 'campaign',
          iconColor: '#74B9FF',
          iconBg: 'rgba(116,185,255,0.10)',
          tag: 'PLATFORM NEWS',
          tagColor: '#74B9FF',
          title: 'CoBuddy is now live in 5 new cities!',
          body: 'We are expanding to Pune, Hyderabad, Chennai, Kolkata, and Ahmedabad. Refer a companion in these cities and earn ₹500 bonus.',
          date: '5 Jun',
          url: 'https://cobuddy.app/expansion',
        },
      ],
    };
  }

  private toSessionPreview(s: any) {
    return {
      sessionId: s.id,
      status: s.status.toLowerCase(),
      category: s.category.toLowerCase(),
      customerInitials: s.customerInitials,
      scheduledStart: s.scheduledStart.toISOString(),
      venueName: s.venueName,
    };
  }

  private toRequestPreview(r: any) {
    return {
      requestId: r.id,
      category: r.category.toLowerCase(),
      customerInitials: r.customerInitials,
      proposedStart: r.proposedStart.toISOString(),
      estimatedEarning: Number(r.estimatedEarning),
      venueArea: r.venueArea,
    };
  }
}
