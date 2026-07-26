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
var SupportGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("../../common/guards/ws-jwt.guard");
let SupportGateway = SupportGateway_1 = class SupportGateway {
    constructor() {
        this.logger = new common_1.Logger(SupportGateway_1.name);
        this.connectedClients = new Map();
    }
    handleConnection(client) {
        this.logger.log(`Client connected to SupportGateway: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from SupportGateway: ${client.id}`);
        this.connectedClients.delete(client.id);
    }
    async handleJoinTicket(client, payload) {
        const companion = client.data.companion;
        if (!companion)
            throw new websockets_1.WsException('Unauthorized');
        const room = `ticket_${payload.ticketId}`;
        client.join(room);
        this.connectedClients.set(client.id, client);
        this.logger.log(`Companion ${companion.sub} joined ticket room: ${room}`);
        client.emit('receive_support_message', {
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderType: 'support',
            text: 'Support chat connected. An agent will assist you shortly.',
            timestamp: new Date().toISOString(),
        });
        return { event: 'joined', room };
    }
    async handleMessage(client, payload) {
        const companion = client.data.companion;
        const room = `ticket_${payload.ticketId}`;
        const message = {
            senderId: companion.sub,
            senderType: 'companion',
            text: payload.text,
            attachmentUrl: payload.attachmentUrl,
            timestamp: new Date().toISOString(),
        };
        this.server.to(room).emit('receive_support_message', message);
        return { success: true, message };
    }
};
exports.SupportGateway = SupportGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SupportGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_ticket'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SupportGateway.prototype, "handleJoinTicket", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_support_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SupportGateway.prototype, "handleMessage", null);
exports.SupportGateway = SupportGateway = SupportGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/support',
        cors: { origin: '*' },
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard)
], SupportGateway);
//# sourceMappingURL=support.gateway.js.map