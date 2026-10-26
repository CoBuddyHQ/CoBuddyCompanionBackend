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
