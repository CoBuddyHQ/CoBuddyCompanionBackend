import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { getCompanionSocketIdentity } from '../../common/types/companion-socket';

@WebSocketGateway({
  namespace: '/sessions',
  cors: {
    origin: (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SessionGateway.name);
  private readonly connectedClients = new Map<string, Socket>();

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to SessionGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from SessionGateway: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string },
  ) {
    const companion = getCompanionSocketIdentity(client);
    if (
      !companion ||
      typeof payload?.sessionId !== 'string' ||
      !payload.sessionId.trim() ||
      payload.sessionId.length > 100
    ) {
      throw new WsException('Unauthorized');
    }

    // Verify session ownership
    const session = await this.prisma.session.findFirst({
      where: { id: payload.sessionId, companionId: companion.sub },
    });
    if (!session) {
      this.logger.warn(
        `Unauthorized join attempt for session ${payload.sessionId} by companion ${companion.sub}`,
      );
      throw new WsException(
        'Unauthorized: session not found or does not belong to you',
      );
    }

    const room = `session_${payload.sessionId}`;
    client.join(room);
    this.connectedClients.set(client.id, client);

    this.logger.log(`Companion ${companion.sub} joined room: ${room}`);
    this.server
      .to(room)
      .emit('companion_joined', { companionId: companion.sub });

    return { event: 'joined', room };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { sessionId: string; text: string; attachmentUrl?: string },
  ) {
    const companion = await this.assertSessionMember(
      client,
      payload?.sessionId,
    );
    if (
      typeof payload.text !== 'string' ||
      !payload.text.trim() ||
      payload.text.length > 5000 ||
      payload.attachmentUrl !== undefined
    ) {
      throw new WsException('Invalid session message');
    }
    const room = `session_${payload.sessionId}`;

    const message = {
      id: `msg-${Date.now()}`,
      senderId: companion.sub,
      senderType: 'companion',
      text: payload.text,
      attachmentUrl: payload.attachmentUrl,
      timestamp: new Date().toISOString(),
    };

    this.server.to(room).emit('receive_message', message);
    return { success: true, message };
  }

  @SubscribeMessage('update_location')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { sessionId: string; lat: number; lng: number; heading?: number },
  ) {
    const companion = await this.assertSessionMember(
      client,
      payload?.sessionId,
    );
    if (
      !Number.isFinite(payload.lat) ||
      payload.lat < -90 ||
      payload.lat > 90 ||
      !Number.isFinite(payload.lng) ||
      payload.lng < -180 ||
      payload.lng > 180 ||
      (payload.heading !== undefined &&
        (!Number.isFinite(payload.heading) ||
          payload.heading < 0 ||
          payload.heading >= 360))
    )
      throw new WsException('Invalid location update');
    const room = `session_${payload.sessionId}`;

    const locationUpdate = {
      companionId: companion.sub,
      lat: payload.lat,
      lng: payload.lng,
      heading: payload.heading,
      timestamp: new Date().toISOString(),
    };

    client.to(room).emit('companion_location_updated', locationUpdate);
    return { success: true };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; isTyping: boolean },
  ) {
    const companion = await this.assertSessionMember(
      client,
      payload?.sessionId,
    );
    if (typeof payload.isTyping !== 'boolean')
      throw new WsException('Invalid typing update');
    const room = `session_${payload.sessionId}`;

    client.to(room).emit('typing', {
      isTyping: payload.isTyping,
      userId: companion.sub,
    });

    return { success: true };
  }

  private async assertSessionMember(client: Socket, sessionId?: string) {
    const companion = getCompanionSocketIdentity(client);
    if (
      !companion ||
      typeof sessionId !== 'string' ||
      !sessionId.trim() ||
      sessionId.length > 100
    ) {
      throw new WsException('Unauthorized');
    }
    const room = `session_${sessionId}`;
    if (!client.rooms.has(room)) throw new WsException('Unauthorized');
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, companionId: companion.sub },
      select: { id: true, status: true },
    });
    if (
      !session ||
      ['completed', 'cancelled', 'no_show'].includes(session.status)
    ) {
      throw new WsException('Unauthorized');
    }
    return companion;
  }
}
