import { InternalService } from './internal.service';

describe('InternalService public profile contract', () => {
  it('does not fabricate profile rates, location, or availability', () => {
    const service = new InternalService({} as any);
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
