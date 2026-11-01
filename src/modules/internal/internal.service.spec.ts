import { ServiceUnavailableException } from '@nestjs/common';
import { InternalService } from './internal.service';

describe('InternalService public profile contract', () => {
  it('does not fabricate profile rates, location, or availability', () => {
    const service = new InternalService({} as any, {} as any);
    const publicProfile = (service as any).sanitizeCompanionPublic({
      id: 'companion-1',
      displayName: 'A Companion',
      hourlyRate: null,
      city: null,
      rating: 0,
      totalReviews: 0,
      totalSessions: 0,
      isAvailable: false,
      isOnline: false,
      weeklySchedules: [],
      serviceAreas: [],
      categories: [],
      languages: [],
      galleryPhotos: [],
    });

    expect(publicProfile.hourlyRate).toBeNull();
    expect(publicProfile.city).toBeNull();
    expect(publicProfile.isAvailable).toBe(false);
    expect(publicProfile.rating).toBe(0);
  });

});

describe('InternalService extension safety boundary', () => {
  it('does not change a session or earnings without verified approval and payment', async () => {
    const prisma = {
      session: { findFirst: jest.fn(), update: jest.fn() },
      earningsTransaction: { create: jest.fn() },
    };
    const service = new InternalService(prisma as any, {} as any);

    await expect(service.extendSessionByBooking('booking-1', 30))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.session.findFirst).not.toHaveBeenCalled();
    expect(prisma.session.update).not.toHaveBeenCalled();
    expect(prisma.earningsTransaction.create).not.toHaveBeenCalled();
  });
});
