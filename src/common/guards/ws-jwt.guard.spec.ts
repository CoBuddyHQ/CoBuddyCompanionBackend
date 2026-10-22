import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from './ws-jwt.guard';

describe('WsJwtGuard live account status', () => {
  const jwt = { verifyAsync: jest.fn() } as unknown as jest.Mocked<JwtService>;
  const config = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const prisma = { companion: { findUnique: jest.fn() } };
  const guard = new WsJwtGuard(jwt, config, prisma as never);
  const context = {
    switchToWs: () => ({
      getClient: () => ({
        data: {},
        handshake: { auth: { token: 'test-token' }, headers: {} },
      }),
    }),
  } as never;

  beforeEach(() => jest.resetAllMocks());

  it('attaches the current active companion from the database', async () => {
    const client = {
      data: {},
      handshake: { auth: { token: 'test-token' }, headers: {} },
    };
    const activeContext = {
      switchToWs: () => ({ getClient: () => client }),
    } as never;
    jwt.verifyAsync = jest
      .fn()
      .mockResolvedValue({ sub: 'companion-1', phone: 'stale' }) as never;
    prisma.companion.findUnique.mockResolvedValue({
      id: 'companion-1',
      phone: 'current',
      accountStatus: 'active',
      deletedAt: null,
    });

    await expect(guard.canActivate(activeContext)).resolves.toBe(true);
    expect(client.data).toEqual({
      companion: {
        sub: 'companion-1',
        phone: 'current',
        accountStatus: 'active',
      },
    });
  });

  it.each(['suspended', 'deactivated', 'deleted'])(
    'rejects a still-valid JWT for a %s account',
    async (accountStatus) => {
      jwt.verifyAsync = jest
        .fn()
        .mockResolvedValue({ sub: 'companion-1' }) as never;
      prisma.companion.findUnique.mockResolvedValue({
        id: 'companion-1',
        phone: 'current',
        accountStatus,
        deletedAt: null,
      });
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        WsException,
      );
    },
  );

  it('rejects a signed token with no companion subject', async () => {
    jwt.verifyAsync = jest.fn().mockResolvedValue({ role: 'admin' }) as never;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      WsException,
    );
    expect(prisma.companion.findUnique).not.toHaveBeenCalled();
  });
});
