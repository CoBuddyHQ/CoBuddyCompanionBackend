import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-internal-service-key'] || request.headers['x-internal-token'];
    const secret = process.env.INTERNAL_SERVICE_SECRET || process.env.INTERNAL_SERVICE_TOKEN || 'cobuddy-internal-service-s2s-token-2026';

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Missing internal service authorization key');
    }

    const tokenBuf = Buffer.from(token);
    const secretBuf = Buffer.from(secret);

    if (tokenBuf.length !== secretBuf.length || !crypto.timingSafeEqual(tokenBuf, secretBuf)) {
      throw new UnauthorizedException('Invalid internal service authorization key');
    }

    return true;
  }
}
