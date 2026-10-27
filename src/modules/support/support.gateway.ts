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
import { SupportService } from './support.service';
import { getCompanionSocketIdentity } from '../../common/types/companion-socket';

@WebSocketGateway({
  namespace: '/support',
  cors: {
    origin: (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class SupportGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportGateway.name);
  private readonly connectedClients = new Map<string, Socket>();

  constructor(private readonly supportService: SupportService) {}

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
    @MessageBody() payload: { ticketId?: string },
  ) {
    const companion = getCompanionSocketIdentity(client);
    if (
      !companion ||
      typeof payload?.ticketId !== 'string' ||
      !payload.ticketId.trim() ||
      payload.ticketId.length > 100
    ) {
      throw new WsException('Unauthorized');
    }
    try {
      await this.supportService.getTicket(companion.sub, payload.ticketId);
    } catch {
      throw new WsException('Ticket not found or unauthorized');
    }

    const room = `ticket_${payload.ticketId}`;
    await client.join(room);
    this.connectedClients.set(client.id, client);

    this.logger.log(`Companion ${companion.sub} joined ticket room: ${room}`);

    // Send welcome message to joining companion
    client.emit('receive_support_message', {
      id: 'sys-welcome-default',
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
    @MessageBody()
    payload: { ticketId?: string; text?: string; attachmentUrl?: string },
  ) {
    const companion = getCompanionSocketIdentity(client);
    if (
      !companion ||
      typeof payload?.ticketId !== 'string' ||
      !payload.ticketId.trim() ||
      typeof payload.text !== 'string' ||
      !payload.text.trim() ||
      payload.text.length > 5000 ||
      payload.attachmentUrl !== undefined ||
      !client.rooms.has(`ticket_${payload.ticketId}`)
    )
      throw new WsException('Invalid or unauthorized support message');
    const room = `ticket_${payload.ticketId}`;
    try {
      const stored = await this.supportService.addTicketMessage(
        companion.sub,
        payload.ticketId,
        payload.text.trim(),
      );
      this.server.to(room).emit('receive_support_message', stored.data);
      return { success: true, message: stored.data };
    } catch {
      throw new WsException('Support message could not be saved.');
    }
  }

  @SubscribeMessage('support_typing')
  async handleSupportTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticketId?: string; isTyping?: boolean },
  ) {
    const companion = getCompanionSocketIdentity(client);
    if (
      !companion ||
      typeof payload?.ticketId !== 'string' ||
      typeof payload.isTyping !== 'boolean' ||
      !client.rooms.has(`ticket_${payload.ticketId}`)
    ) {
      throw new WsException('Invalid or unauthorized support event');
    }
    try {
      await this.supportService.getTicket(companion.sub, payload.ticketId);
    } catch {
      throw new WsException('Ticket not found or unauthorized');
    }
    const room = `ticket_${payload.ticketId}`;
    client.to(room).emit('support_typing', {
      senderId: companion.sub,
      isTyping: payload.isTyping,
    });
  }
}
