import { BadRequestException, ConflictException } from '@nestjs/common';
import { RequestsService } from './requests.service';

describe('RequestsService internal booking contract', () => {
  const valid = {
    bookingId: 'booking-1',
    companionId: 'companion-1',
    customerId: 'customer-1',
    customerInitials: 'C.',
    customerVerified: false,
    customerSafetyConsent: true,
    category: 'cafe_conversation',
    venueName: 'Venue selected by customer',
    proposedStart: '2026-11-01T10:00:00.000Z',
    proposedEnd: '2026-11-01T11:00:00.000Z',
    durationMinutes: 60,
    estimatedEarning: 1200,
    expiresAt: '2026-11-01T09:55:00.000Z',
  };

  const fixture = (overrides: Record<string, unknown> = {}) => {
    const prisma = {
      bookingRequest: { findUnique: jest.fn().mockResolvedValue(null), findFirst: jest.fn().mockResolvedValue(null) },
      companion: { findFirst: jest.fn().mockResolvedValue({ id: 'companion-1', hourlyRate: 1200 }) },
      session: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(),
    };
    const service = new RequestsService(prisma as any, {} as any, {} as any);
    return { prisma, service, input: { ...valid, ...overrides } };
  };

  it('rejects missing safety consent and non-positive server pricing before database writes', async () => {
    const { prisma, service, input } = fixture();
    await expect(service.createInternalRequest({ ...input, customerSafetyConsent: false } as any))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createInternalRequest({ ...input, estimatedEarning: 0 } as any))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects an idempotency key already owned by another customer', async () => {
    const { prisma, service, input } = fixture();
    prisma.bookingRequest.findUnique.mockResolvedValue({
      id: 'booking-1',
      companionId: 'companion-1',
      customerId: 'customer-other',
    });
    await expect(service.createInternalRequest(input as any)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a pending booking that overlaps an existing request', async () => {
    const { prisma, service, input } = fixture();
    prisma.bookingRequest.findFirst.mockResolvedValue({ id: 'pending-request' });
    await expect(service.createInternalRequest(input as any)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
