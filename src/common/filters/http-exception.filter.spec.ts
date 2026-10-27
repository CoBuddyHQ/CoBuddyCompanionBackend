import { ArgumentsHost, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter redaction', () => {
  afterEach(() => jest.restoreAllMocks());

  it('does not log request data or return unexpected exception details', () => {
    const logger = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const request = {
      method: 'POST',
      url: '/auth?token=hidden',
      path: '/auth',
      route: { path: '/auth' },
      body: { otp: 'hidden-body' },
      query: { token: 'hidden-query' },
      ip: 'hidden-ip',
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ headersSent: false, status, json }),
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    new HttpExceptionFilter().catch(new Error('hidden-provider-detail'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Internal server error',
        path: '/auth',
      }),
    );
    const logged = JSON.stringify([
      logger.mock.calls,
      (Logger.prototype.error as jest.Mock).mock.calls,
    ]);
    expect(logged).not.toMatch(/hidden|token=|Body:|Query:|IP:/);
  });
});
