import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(companionId: string) {
    const [companion, activeSessions, upcomingSessions, pendingRequests, unreadNotifs] = await Promise.all([
      this.prisma.companion.findUnique({ where: { id: companionId } }),
      this.prisma.session.findMany({ where: { companionId, status: 'ACTIVE' }, take: 1 }),
      this.prisma.session.findMany({
        where: { companionId, status: { in: ['UPCOMING', 'PRE_ARRIVAL'] } },
        orderBy: { scheduledStart: 'asc' },
        take: 3,
      }),
      this.prisma.bookingRequest.findMany({
        where: { companionId, status: 'PENDING' },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { companionId, isRead: false } }),
    ]);

    if (!companion) throw new NotFoundException('Companion not found');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthTxs = await this.prisma.earningsTransaction.findMany({
      where: {
        companionId,
        createdAt: { gte: monthStart },
        type: { in: ['SESSION_EARNING', 'EXTENSION_EARNING', 'SAFETY_BONUS'] },
        status: { not: 'ON_HOLD' },
      },
    });
    const totalEarnedThisMonth = monthTxs.reduce((sum, t) => sum + Math.max(0, Number(t.amount)), 0);

    return {
      companion: {
        companionId: companion.id,
        displayName: companion.displayName,
        profileStatus: companion.profileStatus.toLowerCase(),
        verificationStatus: companion.verificationStatus.toLowerCase(),
        isAvailable: companion.isAvailable,
        trustScore: companion.trustScore,
        trustLevel: companion.trustLevel.toLowerCase(),
        photoUrl: companion.photoUrl,
      },
      stats: {
        totalEarnedThisMonth,
        unreadNotificationsCount: unreadNotifs,
        pendingRequestsCount: pendingRequests.length,
      },
      activeSession: activeSessions[0] ? this.toSessionPreview(activeSessions[0]) : null,
      upcomingSessions: upcomingSessions.map(s => this.toSessionPreview(s)),
      recentRequests: pendingRequests.slice(0, 3).map(r => this.toRequestPreview(r)),
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
