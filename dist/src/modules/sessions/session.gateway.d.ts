import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
export declare class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    server: Server;
    private readonly logger;
    private readonly connectedClients;
    constructor(prisma: PrismaService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinSession(client: Socket, payload: {
        sessionId: string;
    }): Promise<{
        event: string;
        room: string;
    }>;
    handleMessage(client: Socket, payload: {
        sessionId: string;
        text: string;
        attachmentUrl?: string;
    }): Promise<{
        success: boolean;
        message: {
            id: string;
            senderId: any;
            senderType: string;
            text: string;
            attachmentUrl: string;
            timestamp: string;
        };
    }>;
    handleLocationUpdate(client: Socket, payload: {
        sessionId: string;
        lat: number;
        lng: number;
        heading?: number;
    }): Promise<{
        success: boolean;
    }>;
    handleTyping(client: Socket, payload: {
        sessionId: string;
        isTyping: boolean;
    }): Promise<{
        success: boolean;
    }>;
}
