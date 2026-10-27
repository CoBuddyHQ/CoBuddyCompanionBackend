import { ServiceUnavailableException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

describe('DashboardService announcements', () => {
  const previousAdminApiUrl = process.env.ADMIN_API_URL;
  const previousInternalSecret = process.env.INTERNAL_SERVICE_SECRET;
  const service = new DashboardService({} as any);

  afterEach(() => {
    jest.restoreAllMocks();
    if (previousAdminApiUrl === undefined) delete process.env.ADMIN_API_URL;
    else process.env.ADMIN_API_URL = previousAdminApiUrl;
    if (previousInternalSecret === undefined) delete process.env.INTERNAL_SERVICE_SECRET;
    else process.env.INTERNAL_SERVICE_SECRET = previousInternalSecret;
  });

  it('requests the role-scoped Admin route with the S2S credential', async () => {
    process.env.ADMIN_API_URL = 'https://admin.example.test/';
    process.env.INTERNAL_SERVICE_SECRET = 'internal-secret-for-this-test';
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'announcement-1', targetAudience: 'COMPANIONS' }],
    } as Response);

    await expect(service.getAnnouncements()).resolves.toEqual({
      announcements: [{ id: 'announcement-1', targetAudience: 'COMPANIONS' }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://admin.example.test/api/internal/announcements/companions/active',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Internal-Service-Key': 'internal-secret-for-this-test',
        }),
      }),
    );
  });

  it('fails closed if Admin S2S configuration is missing', async () => {
    delete process.env.ADMIN_API_URL;
    delete process.env.INTERNAL_SERVICE_SECRET;
    await expect(service.getAnnouncements()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('surfaces Admin failures instead of returning an empty success', async () => {
    process.env.ADMIN_API_URL = 'https://admin.example.test';
    process.env.INTERNAL_SERVICE_SECRET = 'internal-secret-for-this-test';
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 403 } as Response);
    await expect(service.getAnnouncements()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
