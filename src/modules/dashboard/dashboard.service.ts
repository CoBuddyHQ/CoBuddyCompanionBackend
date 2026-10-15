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
    try {
      const adminUrl = (process.env.ADMIN_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
      const res = await fetch(`${adminUrl}/api/marketing/announcements`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json: any = await res.json();
        if (Array.isArray(json?.data)) {
          return { announcements: json.data };
        }
      }
    } catch {
      // Non-blocking fallback
    }
    return { announcements: [] };
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
