import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  
  // Mapping of companionId -> Set<socketId>
  private connectedCompanions = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const tokenStr = client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (!tokenStr) {
        throw new Error('No token provided');
      }
      const [type, token] = tokenStr.split(' ');
      const actualToken = type === 'Bearer' ? token : tokenStr;

      const payload = await this.jwtService.verifyAsync(actualToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const companionId = payload.sub;
      client.data.companionId = companionId;

      if (!this.connectedCompanions.has(companionId)) {
        this.connectedCompanions.set(companionId, new Set());
      }
      this.connectedCompanions.get(companionId).add(client.id);

      this.logger.log(`Client connected: ${client.id} (Companion: ${companionId})`);
    } catch (err) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const companionId = client.data.companionId;
    if (companionId && this.connectedCompanions.has(companionId)) {
      this.connectedCompanions.get(companionId).delete(client.id);
      if (this.connectedCompanions.get(companionId).size === 0) {
        this.connectedCompanions.delete(companionId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  // Called by other services (e.g. RequestsService) to alert the companion
  emitNewBookingRequest(companionId: string, requestData: any) {
    const sockets = this.connectedCompanions.get(companionId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit('new_booking_request', requestData);
      });
      this.logger.log(`Emitted new_booking_request to companion ${companionId}`);
    } else {
      this.logger.log(`Could not emit to ${companionId}: Not connected via WS`);
    }
  }

  emitNotification(companionId: string, notificationData: any) {
    const sockets = this.connectedCompanions.get(companionId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit('notification', notificationData);
      });
    }
  }
}
