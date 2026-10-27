import { FcmService } from './fcm.service';

describe('FcmService without provider configuration', () => {
  let service: FcmService;

  beforeEach(() => {
    service = new FcmService();
    (service as unknown as { initialized: boolean }).initialized = false;
    (service as unknown as { firebaseAdmin: null }).firebaseAdmin = null;
  });

  it('does not report a single push as delivered when Firebase is unavailable', async () => {
    await expect(
      service.sendToToken('test-token', {
        title: 'Test',
        body: 'Test message',
      }),
    ).resolves.toBe(false);
  });

  it('reports all attempted batch pushes as failed when Firebase is unavailable', async () => {
    await expect(
      service.sendToMultiple(['token-a', 'token-b'], {
        title: 'Test',
        body: 'Test message',
      }),
    ).resolves.toEqual({ successCount: 0, failureCount: 2 });
  });
});
