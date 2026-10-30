import { BadRequestException, ConflictException } from '@nestjs/common';
import { RequestsService } from './requests.service';

const start = new Date('2026-11-01T10:00:00.000Z');
const end = new Date('2026-11-01T12:00:00.000Z');

function createHarness(overrides: { conflict?: boolean; counter?: boolean } = {}) {
  const request = {
    id: 'request-1',
    companionId: 'companion-1',
    status: overrides.counter ? 'counter_proposed' : 'pending',
    expiresAt: new Date(Date.now() + 60_000),
    proposedStart: start,
    proposedEnd: end,
    counterProposedStart: overrides.counter ? new Date('2026-11-01T13:00:00.000Z') : null,
    counterProposedEnd: overrides.counter ? new Date('2026-11-01T15:00:00.000Z') : null,
    customerId: 'customer-1',
    customerInitials: 'AB',
    customerTrustScore: 0,
    customerVerified: false,
    customerSessionCount: 0,
    customerSafetyConsent: true,
    customerIdentityVerified: true,
    category: 'cafe_conversation',
    venueId: null,
    venueName: 'Cafe',
    venueArea: 'Area',
    venueCity: 'City',
    venueType: 'PUBLIC',
    venueMeetingPoint: null,
    venueLandmark: null,
    isVenueApproved: true,
    durationMinutes: 120,
    language: 'Hindi',
    estimatedEarning: 2000,
    matchScore: 0,
    receivedAt: start,
    customerNote: null,
  };
  const acceptedRequest = { ...request, status: 'accepted' };
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    bookingRequest: {
      findFirst: jest.fn().mockResolvedValue(request),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(acceptedRequest),
    },
    session: {
      findFirst: jest.fn().mockResolvedValue(overrides.conflict ? { id: 'existing-session' } : null),
      create: jest.fn().mockResolvedValue({ id: 'session-1' }),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notification-1', title: 'Accepted', body: 'Accepted' }),
    },
  };
  const prisma = {
    $transaction: jest.fn((callback: (value: any) => unknown) => callback(tx)),
    bookingRequest: { findFirst: jest.fn().mockResolvedValue(request) },
  };
  const notifications = { emitNotification: jest.fn(), emitSessionUpdated: jest.fn(), emitBookingUpdated: jest.fn() };
  const bridge = { syncBookingStatus: jest.fn().mockResolvedValue(true) };
  const service = new RequestsService(prisma as any, notifications as any, bridge as any);
  return { service, tx, bridge, notifications, prisma };
}

describe('companion booking acceptance', () => {
  it('serializes acceptance and rejects a time range overlapping an existing session', async () => {
    const { service, tx } = createHarness({ conflict: true });

    await expect(service.acceptRequest('companion-1', 'request-1')).rejects.toBeInstanceOf(ConflictException);
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.bookingRequest.updateMany).not.toHaveBeenCalled();
    expect(tx.session.create).not.toHaveBeenCalled();
  });

  it('uses the counter-proposed schedule when accepting that request', async () => {
    const { service, tx, bridge } = createHarness({ counter: true });

    await service.acceptRequest('companion-1', 'request-1');

    const counterStart = new Date('2026-11-01T13:00:00.000Z');
    const counterEnd = new Date('2026-11-01T15:00:00.000Z');
    expect(tx.bookingRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'accepted', proposedStart: counterStart, proposedEnd: counterEnd }),
    }));
    expect(tx.session.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ scheduledStart: counterStart, scheduledEnd: counterEnd }),
    }));
    expect(bridge.syncBookingStatus).toHaveBeenCalledWith(expect.objectContaining({
      customerBookingId: 'request-1',
      status: 'accepted',
      newStart: counterStart.toISOString(),
      newEnd: counterEnd.toISOString(),
    }));
  });

  it('auto-declines any overlapping pending requests when accepting a booking', async () => {
    const { service, tx, bridge } = createHarness();
    const overlappingReq = {
      id: 'request-2',
      companionId: 'companion-1',
      status: 'pending',
      customerInitials: 'CD',
      proposedStart: start,
      proposedEnd: end,
    };
    tx.bookingRequest.findMany = jest.fn().mockResolvedValue([overlappingReq]);

    await service.acceptRequest('companion-1', 'request-1');

    expect(tx.bookingRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ['request-2'] } },
      data: expect.objectContaining({
        status: 'declined',
        declineReason: 'Companion accepted another confirmed booking for this time slot',
      }),
    }));
    expect(bridge.syncBookingStatus).toHaveBeenCalledWith(expect.objectContaining({
      customerBookingId: 'request-2',
      status: 'declined',
      reason: 'Companion accepted another confirmed booking for this time slot',
    }));
  });

  it('routes a customer acceptance of a counter-offer through companion acceptance', async () => {
    const { service, prisma } = createHarness({ counter: true });
    const acceptSpy = jest.spyOn(service, 'acceptRequest').mockResolvedValue({
      sessionPassCode: '7314',
    } as any);

    await expect(service.respondToCustomerCounterOffer('request-1', 'accept'))
      .resolves.toMatchObject({ sessionPassCode: '7314' });
    expect(prisma.bookingRequest.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'request-1', status: 'counter_proposed' },
    }));
    expect(acceptSpy).toHaveBeenCalledWith('companion-1', 'request-1');
  });

  it('rejects expired counter-offers without applying the response', async () => {
    const { service, prisma } = createHarness({ counter: true });
    prisma.bookingRequest.findFirst.mockResolvedValue({
      companionId: 'companion-1',
      expiresAt: new Date(Date.now() - 1000),
    });
    const acceptSpy = jest.spyOn(service, 'acceptRequest');

    await expect(service.respondToCustomerCounterOffer('request-1', 'accept'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(acceptSpy).not.toHaveBeenCalled();
  });
});
