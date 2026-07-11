"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SessionGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("../../common/guards/ws-jwt.guard");
let SessionGateway = SessionGateway_1 = class SessionGateway {
    constructor() {
        this.logger = new common_1.Logger(SessionGateway_1.name);
        this.connectedClients = new Map();
    }
    handleConnection(client) {
        this.logger.log(`Client connected to SessionGateway: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from SessionGateway: ${client.id}`);
        this.connectedClients.delete(client.id);
    }
    async handleJoinSession(client, payload) {
        const companion = client.data.companion;
        if (!companion)
            throw new websockets_1.WsException('Unauthorized');
        const room = `session_${payload.sessionId}`;
        client.join(room);
        this.connectedClients.set(client.id, client);
        this.logger.log(`Companion ${companion.sub} joined room: ${room}`);
        this.server.to(room).emit('companion_joined', { companionId: companion.sub });
        return { event: 'joined', room };
    }
    async handleMessage(client, payload) {
        const companion = client.data.companion;
        const room = `session_${payload.sessionId}`;
        const message = {
            senderId: companion.sub,
            senderType: 'companion',
            text: payload.text,
            attachmentUrl: payload.attachmentUrl,
            timestamp: new Date().toISOString(),
        };
        this.server.to(room).emit('receive_message', message);
        return { success: true, message };
    }
    async handleLocationUpdate(client, payload) {
        const companion = client.data.companion;
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
};
exports.SessionGateway = SessionGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SessionGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SessionGateway.prototype, "handleJoinSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SessionGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('update_location'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SessionGateway.prototype, "handleLocationUpdate", null);
exports.SessionGateway = SessionGateway = SessionGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/sessions',
        cors: { origin: '*' },
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard)
], SessionGateway);
//# sourceMappingURL=session.gateway.js.map