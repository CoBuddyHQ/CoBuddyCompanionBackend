import { RequestSimulatorService } from './request-simulator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

describe('RequestSimulatorService', () => {
  const originalEnv = process.env;
  let prisma: { companion: { findMany: jest.Mock } };
  let service: RequestSimulatorService;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    delete process.env.ENABLE_REQUEST_SIMULATOR;
    prisma = { companion: { findMany: jest.fn() } };
    service = new RequestSimulatorService(
      prisma as unknown as PrismaService,
      { emitNewBookingRequest: jest.fn() } as unknown as NotificationsGateway,
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does not create synthetic requests unless explicitly enabled', async () => {
    await service.createSimulatedRequest();
    expect(prisma.companion.findMany).not.toHaveBeenCalled();
  });

  it('never creates synthetic requests in production, even when enabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_REQUEST_SIMULATOR = 'true';

    await service.createSimulatedRequest();
    expect(prisma.companion.findMany).not.toHaveBeenCalled();
  });
});
