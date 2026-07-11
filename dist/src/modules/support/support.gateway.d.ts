import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private readonly connectedClients;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinTicket(client: Socket, payload: {
        ticketId: string;
    }): Promise<{
        event: string;
        room: string;
    }>;
    handleMessage(client: Socket, payload: {
        ticketId: string;
        text: string;
        attachmentUrl?: string;
    }): Promise<{
        success: boolean;
        message: {
            senderId: any;
            senderType: string;
            text: string;
            attachmentUrl: string;
            timestamp: string;
        };
    }>;
}
