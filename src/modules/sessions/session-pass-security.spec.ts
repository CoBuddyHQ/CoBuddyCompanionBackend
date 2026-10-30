import { SessionsService } from './sessions.service';

describe('session pass ownership boundary', () => {
  it.each(['', '42', '7842', '0000', 'prefix-7359', '7359-suffix'])(
    'rejects a nonmatching pass without activating the session', async pass => {
      const prisma = { session: {
        findFirst: jest.fn().mockResolvedValue({ id: 'session', companionId: 'owner', status: 'checked_in', sessionPassCode: '7359' }),
        update: jest.fn(),
      } };
      await expect(new SessionsService(prisma as any, {} as any).verifyCustomer('owner', 'session', pass)).rejects.toThrow('Invalid session pass code');
      expect(prisma.session.update).not.toHaveBeenCalled();
    },
  );
});

describe('recent booking status reconciliation', () => {
  it('resends source-of-truth completed states to customer-owned booking records', async () => {
    const prisma = { session: { findMany: jest.fn().mockResolvedValue([
      { id: 's1', requestId: 'b1', status: 'completed' },
      { id: 's2', requestId: 'b2', status: 'active' },
      { id: 's3', requestId: 'b3', status: 'upcoming', sessionPassCode: '9137' },
    ]) } };
    const bridge = { syncBookingStatus: jest.fn().mockResolvedValue(true) };
    const service = new SessionsService(prisma as any, {} as any, bridge as any);
    await service.reconcileRecentBookingStatuses();
    expect(bridge.syncBookingStatus).toHaveBeenNthCalledWith(1, { customerBookingId: 'b1', sessionId: 's1', status: 'completed' });
    expect(bridge.syncBookingStatus).toHaveBeenNthCalledWith(2, { customerBookingId: 'b2', sessionId: 's2', status: 'in_progress' });
    expect(bridge.syncBookingStatus).toHaveBeenNthCalledWith(3, {
      customerBookingId: 'b3', sessionId: 's3', status: 'accepted', sessionPassCode: '9137',
    });
  });
  it('stops the batch on the first unavailable customer callback so it retries later', async () => {
    const prisma = { session: { findMany: jest.fn().mockResolvedValue([
      { id: 's1', requestId: 'b1', status: 'completed' },
      { id: 's2', requestId: 'b2', status: 'completed' },
    ]) } };
    const bridge = { syncBookingStatus: jest.fn().mockResolvedValue(false) };
    await new SessionsService(prisma as any, {} as any, bridge as any).reconcileRecentBookingStatuses();
    expect(bridge.syncBookingStatus).toHaveBeenCalledTimes(1);
  });
});

describe('pending companion review synchronization', () => {
  const originalAdminUrl = process.env.ADMIN_API_URL;
  const originalServiceSecret = process.env.INTERNAL_SERVICE_SECRET;

  afterEach(() => {
    if (originalAdminUrl === undefined) delete process.env.ADMIN_API_URL;
    else process.env.ADMIN_API_URL = originalAdminUrl;
    if (originalServiceSecret === undefined) delete process.env.INTERNAL_SERVICE_SECRET;
    else process.env.INTERNAL_SERVICE_SECRET = originalServiceSecret;
    jest.restoreAllMocks();
  });

  it('marks a companion review synced only after Admin confirms it', async () => {
    process.env.ADMIN_API_URL = 'https://admin.example.test';
    process.env.INTERNAL_SERVICE_SECRET = 'test-secret';
    const session = {
      id: 'session-1', requestId: 'booking-1', companionId: 'companion-1', customerId: 'customer-1',
      customerRating: 5, customerFeedback: 'Great', customerRatingHighlights: ['kind'],
    };
    const prisma = { session: {
      findMany: jest.fn().mockResolvedValue([session]),
      update: jest.fn().mockResolvedValue({}),
    } };
    const service = new SessionsService(prisma as any, {} as any);
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await service.reconcilePendingAdminReviews();

    expect(global.fetch).toHaveBeenCalledWith('https://admin.example.test/api/internal/reviews/sync', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'x-internal-service-key': 'test-secret' }),
    }));
    expect(prisma.session.update).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { id: 'session-1' }, data: expect.objectContaining({ adminReviewSyncAttemptedAt: expect.any(Date) }),
    }));
    expect(prisma.session.update).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { id: 'session-1' }, data: expect.objectContaining({ adminReviewSyncedAt: expect.any(Date) }),
    }));
  });

  it('leaves a failed Admin sync pending for retry', async () => {
    process.env.INTERNAL_SERVICE_SECRET = 'test-secret';
    const prisma = { session: {
      findMany: jest.fn().mockResolvedValue([{
        id: 'session-2', requestId: 'booking-2', companionId: 'companion-2', customerId: 'customer-2',
        customerRating: 4, customerFeedback: null, customerRatingHighlights: [],
      }]),
      update: jest.fn().mockResolvedValue({}),
    } };
    const service = new SessionsService(prisma as any, {} as any);
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 503 } as Response);

    await service.reconcilePendingAdminReviews();

    expect(prisma.session.update).toHaveBeenCalledTimes(1);
    expect(prisma.session.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ adminReviewSyncAttemptedAt: expect.any(Date) }),
    }));
  });
});
