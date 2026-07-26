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
  namespace: '/support',
  cors: { origin: '*' },
})
@UseGuards(WsJwtGuard)
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportGateway.name);
  private readonly connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to SupportGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from SupportGateway: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join_ticket')
  async handleJoinTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticketId: string },
  ) {
    const companion = client.data.companion;
    if (!companion) throw new WsException('Unauthorized');

    const room = `ticket_${payload.ticketId}`;
    client.join(room);
    this.connectedClients.set(client.id, client);

    this.logger.log(`Companion ${companion.sub} joined ticket room: ${room}`);

    // Send welcome message to joining companion
    client.emit('receive_support_message', {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderType: 'support',
      text: 'Support chat connected. An agent will assist you shortly.',
      timestamp: new Date().toISOString(),
    });

    return { event: 'joined', room };
  }


  @SubscribeMessage('send_support_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticketId: string; text: string; attachmentUrl?: string },
  ) {
    const companion = client.data.companion;
    const room = `ticket_${payload.ticketId}`;

    const message = {
      senderId: companion.sub,
      senderType: 'companion',
      text: payload.text,
      attachmentUrl: payload.attachmentUrl,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to the support agent and companion in the room
    this.server.to(room).emit('receive_support_message', message);
    
    // In a real scenario, we'd also call SupportService to save the message to DB
    return { success: true, message };
  }
}
