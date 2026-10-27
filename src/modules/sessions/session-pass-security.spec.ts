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
    ]) } };
    const bridge = { syncBookingStatus: jest.fn().mockResolvedValue(true) };
    const service = new SessionsService(prisma as any, {} as any, bridge as any);
    await service.reconcileRecentBookingStatuses();
    expect(bridge.syncBookingStatus).toHaveBeenNthCalledWith(1, { customerBookingId: 'b1', sessionId: 's1', status: 'completed' });
    expect(bridge.syncBookingStatus).toHaveBeenNthCalledWith(2, { customerBookingId: 'b2', sessionId: 's2', status: 'in_progress' });
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
