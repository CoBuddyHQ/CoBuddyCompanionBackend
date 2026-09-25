import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { method, url, body, query, ip } = request;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exRes = exception.getResponse();
      if (typeof exRes === 'string') {
        message = exRes;
      } else if (typeof exRes === 'object' && exRes !== null) {
        const r = exRes as any;
        if (Array.isArray(r.message)) {
          message = r.message.join('; ');
        } else {
          message = r.message ?? message;
        }
        error = r.error ?? error;
      }
      error = this.statusToError(status);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
    }

    // Sanitize sensitive fields (password, pass, pin, token, secret)
    const sanitize = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj;
      const copy = { ...obj };
      ['password', 'pass', 'pin', 'token', 'secret', 'otp'].forEach(key => {
        if (key in copy && typeof copy[key] === 'string') {
          copy[key] = '***MASKED***';
        }
      });
      return copy;
    };

    const sanitizedBody = sanitize(body);
    const bodyStr = Object.keys(sanitizedBody || {}).length ? ` | Body: ${JSON.stringify(sanitizedBody)}` : '';
    const queryStr = Object.keys(query || {}).length ? ` | Query: ${JSON.stringify(query)}` : '';

    if (status >= 500) {
      this.logger.error(
        `❌ [HTTP ERROR ${status}] ${method} ${url} (IP: ${ip || 'local'})${queryStr}${bodyStr} → ${message}`,
      );
    } else {
      this.logger.warn(
        `⚠️ [HTTP WARN ${status}] ${method} ${url} (IP: ${ip || 'local'})${queryStr}${bodyStr} → ${message}`,
      );
    }

    if (response.headersSent) {
      return;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });

  }

  private statusToError(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
