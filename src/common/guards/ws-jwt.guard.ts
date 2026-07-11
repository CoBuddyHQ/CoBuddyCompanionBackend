import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHeader(client);

      if (!token) {
        throw new WsException('Unauthorized access');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      
      // We attach the companion payload to client data so gateways can access it
      client.data.companion = payload;
      return true;
    } catch (err) {
      this.logger.error('WebSocket auth failed', err);
      throw new WsException('Unauthorized access');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // Check both standard auth payload and headers
    const tokenStr = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (!tokenStr) return undefined;
    
    // Support "Bearer <token>" or just "<token>"
    const [type, token] = tokenStr.split(' ');
    return type === 'Bearer' ? token : tokenStr;
  }
}
