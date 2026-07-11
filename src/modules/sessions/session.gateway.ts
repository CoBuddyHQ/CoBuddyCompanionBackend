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

@WebSocketGateway({
  namespace: '/sessions',
  cors: { origin: '*' }, // Inherits global CORS ideally, but explicitly defined here for safety
})
@UseGuards(WsJwtGuard)
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SessionGateway.name);

  // We could store socket-to-session mappings in Redis for a scalable production setup.
  // Using memory Map for the MVP scope.
  private readonly connectedClients = new Map<string, Socket>();

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
    const companion = client.data.companion;
    if (!companion) throw new WsException('Unauthorized');

    const room = `session_${payload.sessionId}`;
    client.join(room);
    this.connectedClients.set(client.id, client);

    this.logger.log(`Companion ${companion.sub} joined room: ${room}`);

    // Notify others in the room
    this.server.to(room).emit('companion_joined', { companionId: companion.sub });
    
    return { event: 'joined', room };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; text: string; attachmentUrl?: string },
  ) {
    const companion = client.data.companion;
    const room = `session_${payload.sessionId}`;

    const message = {
      senderId: companion.sub,
      senderType: 'companion',
      text: payload.text,
      attachmentUrl: payload.attachmentUrl,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to room
    this.server.to(room).emit('receive_message', message);
    
    // E.g. Also save to database here via SessionService
    return { success: true, message };
  }

  @SubscribeMessage('update_location')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; lat: number; lng: number; heading?: number },
  ) {
    const companion = client.data.companion;
    const room = `session_${payload.sessionId}`;

    const locationUpdate = {
      companionId: companion.sub,
      lat: payload.lat,
      lng: payload.lng,
      heading: payload.heading,
      timestamp: new Date().toISOString(),
    };

    // Broadcast location to the customer in the room
    client.to(room).emit('companion_location_updated', locationUpdate);
    
    return { success: true };
  }
}
