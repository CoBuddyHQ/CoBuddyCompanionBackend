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

  it('applies only an authenticated customer change to an unexpired pending request and persists a notification', async () => {
    const request = {
      id: 'booking-1', companionId: 'companion-1', status: 'pending', category: 'cafe_conversation',
      customerId: 'customer-1', customerInitials: 'C.', customerTrustScore: 0, customerVerified: false,
      customerSessionCount: 0, customerSafetyConsent: true, customerIdentityVerified: false,
      venueName: 'New venue', venueArea: 'Area', venueCity: 'Pune', venueType: 'PUBLIC',
      venueMeetingPoint: null, venueLandmark: null, isVenueApproved: false,
      proposedStart: new Date('2026-11-01T12:00:00.000Z'), proposedEnd: new Date('2026-11-01T14:00:00.000Z'),
      durationMinutes: 120, language: 'Unspecified', estimatedEarning: '2400', matchScore: 0,
      customerNote: null, expiresAt: new Date('2026-11-01T09:55:00.000Z'),
      receivedAt: new Date('2026-10-30T09:00:00.000Z'),
    };
    const tx = {
      bookingRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue(request),
      },
      notification: { create: jest.fn().mockResolvedValue({ id: 'notification-1' }) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const notificationsGateway = { emitNotification: jest.fn() };
    const service = new RequestsService(prisma as any, notificationsGateway as any, {} as any);

    await expect(service.modifyInternalRequest('booking-1', {
      proposedStart: request.proposedStart.toISOString(),
      proposedEnd: request.proposedEnd.toISOString(),
      durationMinutes: 120,
      venueName: 'New venue',
      estimatedEarning: '2400',
    })).resolves.toMatchObject({ success: true, request: { requestId: 'booking-1' } });
    expect(tx.bookingRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'booking-1', status: 'pending', expiresAt: { gt: expect.any(Date) } },
      data: expect.objectContaining({ durationMinutes: 120, venueName: 'New venue', estimatedEarning: '2400' }),
    }));
    expect(tx.notification.create).toHaveBeenCalledTimes(1);
    expect(notificationsGateway.emitNotification).toHaveBeenCalledWith('companion-1', expect.any(Object));
  });

  it('rejects changes after the Companion has accepted the request', async () => {
    const tx = {
      bookingRequest: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      notification: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const service = new RequestsService(prisma as any, { emitNotification: jest.fn() } as any, {} as any);

    await expect(service.modifyInternalRequest('booking-1', { venueName: 'New venue' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(tx.notification.create).not.toHaveBeenCalled();
  });
});
