import { AuthService } from './auth.service';
describe('refresh security', () => {
  const make = (accountStatus: string, count = 1) => ({ refreshToken: {
    findUnique: jest.fn().mockResolvedValue({ id: 'test', expiresAt: new Date(Date.now() + 60000), isRevoked: false, companion: { accountStatus } }),
    updateMany: jest.fn().mockResolvedValue({ count }),
  } });
  it.each(['deleted', 'suspended', 'deactivated'])('rejects %s accounts', async status => {
    const prisma = make(status);
    await expect(new AuthService(prisma as any, {} as any, {} as any).refreshToken({ refreshToken: 'test' })).rejects.toThrow('Account is not active');
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });
  it('rejects a concurrently consumed token before signing another token', async () => {
    const prisma = make('active', 0);
    await expect(new AuthService(prisma as any, {} as any, {} as any).refreshToken({ refreshToken: 'test' })).rejects.toThrow('already used');
  });
});
