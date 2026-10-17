import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expected = process.env.INTERNAL_SERVICE_SECRET;
    const token = request.headers['x-internal-service-key'];
    if (!expected) {
      throw new ServiceUnavailableException('Internal service authentication is not configured.');
    }
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Invalid or missing internal service token');
    }

    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expected);
    const matches = tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf);

    if (!matches) {
      throw new UnauthorizedException('Invalid or missing internal service token');
    }

    return true;
  }
}
