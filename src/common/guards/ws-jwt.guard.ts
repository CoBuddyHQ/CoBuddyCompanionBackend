import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHeader(client);

      if (!token) {
        throw new WsException('Unauthorized access');
      }

      const verified: unknown = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (
        !verified ||
        typeof verified !== 'object' ||
        !('sub' in verified) ||
        typeof verified.sub !== 'string'
      ) {
        throw new WsException('Unauthorized access');
      }
      const companion = await this.prisma.companion.findUnique({
        where: { id: verified.sub },
        select: { id: true, phone: true, accountStatus: true, deletedAt: true },
      });
      if (
        !companion ||
        companion.deletedAt ||
        companion.accountStatus !== 'active'
      ) {
        throw new WsException('Unauthorized access');
      }
      client.data.companion = {
        sub: companion.id,
        phone: companion.phone,
        accountStatus: companion.accountStatus,
      };
      return true;
    } catch {
      this.logger.warn('WebSocket authentication rejected.');
      throw new WsException('Unauthorized access');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // Check both standard auth payload and headers
    const authToken: unknown = client.handshake.auth?.token;
    const headerToken: unknown = client.handshake.headers?.authorization;
    const tokenStr = typeof authToken === 'string' ? authToken : headerToken;
    if (typeof tokenStr !== 'string' || !tokenStr.trim()) return undefined;

    // Support "Bearer <token>" or just "<token>"
    const [type, token] = tokenStr.split(' ');
    return type === 'Bearer' ? token : tokenStr;
  }
}
