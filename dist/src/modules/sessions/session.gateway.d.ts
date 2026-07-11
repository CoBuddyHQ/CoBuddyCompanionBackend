import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private readonly connectedClients;
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
}
